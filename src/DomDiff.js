const createElement = function (name, content, children = []) {
  if (name === "TEXT") {
    return { type: "element", name };
  } else {
    let element = { type: "element", name, children };
    if (content && typeof content === "string") {
      const text = createTextElement(content);
      element.children.push(text);
    }
    return element;
  }
};

// zip helper
const zip = (a, b) => {
  const result = [];
  const maxSize = Math.max(a.length, b.length);
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < maxSize; i++) {
      result.push([a[i], b[i], i]);
    }
  }
  return result;
};

const hasChildren = (node) => {
  return !isText(node) && node.childNodes.length > 0;
};

const isText = (node) => {
  return node?.nodeType === 3;
};

/**
 *  deux cas : old position/new position
 *  ou : n'existe pas dans la liste
 */

const createKeyMap = (list, key) => {
  const result = {};
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!isText(item)) {
      const keyValue = item.dataset.key;
      if (keyValue) {
        result[keyValue] = i;
      }
    }
  }
  return result;
};

const getItemKey = (item) => {
  return item?.dataset?.key;
};

const rmEmptyText = (nodes) => {
  return nodes.filter((node) => {
    return !isText(node) || (isText(node) && node.textContent.trim() !== "");
  });
};

export default function DomDiff(currentTree, newTree, index, patches = [], parent) {
  if (!currentTree && !newTree) {
    return null;
  }
  console.log([currentTree, newTree, parent]);
  if (!currentTree && parent) {
    patches.push({
      type: "APPEND_NODE",
      target: newTree,
      parentNode: parent,
    });
  } else if (currentTree && !newTree) {
    // Array.from(currentTree.childNodes).forEach((node) => {
    patches.push({ type: "REMOVE_NODE", target: currentTree });
    // });
  } else if (!currentTree) {
    patches.push({ type: "CREATE_NODE", target: newTree });
  } else if (currentTree.tagName === newTree.tagName) {
    if (hasChildren(currentTree) && hasChildren(newTree)) {
      const currentTreeArr = rmEmptyText(Array.from(currentTree.childNodes));
      const newTreeArr = rmEmptyText(Array.from(newTree.childNodes));

      const currentTreeKM = createKeyMap(currentTreeArr, "key");
      const newTreeKM = createKeyMap(newTreeArr, "key");

      // clean original
      for (let i = 0; i < currentTreeArr.length; i++) {
        const item = currentTreeArr[i];
        const itemKey = getItemKey(item);
        if (itemKey && !Object.keys(newTreeKM).includes(itemKey)) {
          item.parentNode.removeChild(item);
          currentTreeArr.splice(i, 1);
        }
      }

      /* handle move before anything else */
      for (let i = 0; i < newTreeArr.length; i++) {
        const newItem = newTreeArr[i];
        const curItem = currentTreeArr[i];
        const newItemKey = getItemKey(newItem);
        const curItemKey = getItemKey(curItem);
        if (!newItemKey && !curItemKey) {
          continue;
        }
        if (newItemKey == curItemKey) {
          continue; //item is already at the good position
        }
        // move if current item is at the wrong position
        const curPosition = currentTreeKM[newItemKey];
        if (!curPosition) {
          // insert at position | simulate insertion
          currentTreeArr.splice(i, 0, null);
        } else if (curPosition && curPosition !== i) {
          // DJW - move algo
          // -> cut and past
          const data = currentTreeArr[curPosition];
          currentTreeArr.splice(curPosition, 1); // cut
          currentTreeArr.splice(i, 0, data); // paste
          patches.push({ type: "MOVE_NODE", target: newItem, at: i });
        }
        // handle adjacent item
        /*if (newItemKey == getItemKey(currentTreeArr[i + 1])) {
            patches.push({ type: "REMOVE_NODE", target: newItem, at: i });
            currentTreeArr.splice(i, 1);
          } else {
            patches.push({ type: "ORDER_NODE", target: newItem, at: i });
            currentTreeArr.splice(i, 0, currentTreeArr[curPosition]);
          }
        }*/
      }

      const zippedChildren = zip(Array.from(currentTreeArr), Array.from(newTreeArr));
      // handle fragment wrapper parent Node
      zippedChildren.forEach(([currentNode, newNode, index]) => {
        DomDiff(currentNode, newNode, index, patches, currentTree);
      });
    } else if (isText(currentTree) && isText(newTree)) {
      if (currentTree.textContent !== newTree.textContent) {
        patches.push({
          type: "REPLACE_TEXT",
          oldValue: currentTree.textContent,
          newValue: newTree.textContent,
          target: currentTree,
        });
      }
    } else {
      patches.push({ type: "KEEP_NODE", target: currentTree }); //to Test
    }
  } else {
    // replace old by new | f
    patches.push({
      type: "REPLACE_NODE",
      source: currentTree,
      target: newTree,
    });
  }
  // empty patch:no change detected -> keep node
  return patches;
}

/**
 * Patches sections
 */

const fnMap = {
  APPEND_NODE: ({ target, parentNode }) => {
    parentNode.appendChild(target);
  },

  REMOVE_NODE: ({ target }) => {
    target.parentNode.removeChild(target);
  },

  MOVE_NODE: ({ target }) => {
    return;
  },

  REPLACE_NODE: ({ source, target }) => {
    source.parentNode.replaceChild(target, source);
  },

  REPLACE_TEXT: ({ newValue, target }) => {
    target.textContent = newValue;
  },

  CREATE_NODE: ({ target }) => target,
};

// Handle diff
const doPatch = function (patch) {
  const func = fnMap[patch.type];
  if (typeof func === "function") {
    func(patch);
  } else {
    throw new Error(`Patch ${patch.type} not Found!`);
  }
};

// Apply diff -> newDomList
const applyPatches = function (patches) {
  patches.map(doPatch);
};

//list
const listToFragment = function (list) {
  return { nodeType: 11, childNodes: list };
};

export { DomDiff, applyPatches, listToFragment };
