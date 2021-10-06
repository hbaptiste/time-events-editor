/***
 * <div>
 *    <p>Radical Blaze</p>
 *    <ul>
 *      <li>Premier li</li>
 *      <li>Second Strop</li>
 *      <li> Last Blaz</li>
 *    </ul>
 *    <p>last</p>
 * </div>
 * <div>
 *   <ul>
 *     <li>NewElement</>
 *     <li>Blaze</li>
 *   </ul>
 * </div>
 * * remove extra element
 * * handle text node
 */
/**
 * - test
 * - replace work -> OK
 * -
 */

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
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) {
      result.push([a[i], b[i]]);
    }
  }
  return result;
};

// ? Comment connaitre l'état final du Dom
export default function DomDiff(currentTree, newTree, patches = [], parent) {
  if (!currentTree && !newTree) {
    return;
  }
  if (!currentTree && parent) {
    patches.push({
      type: "APPEND_NODE",
      target: newTree,
      parentNode: parent,
    });
  } else if (!newTree) {
    console.log("newTree is EMPTY");
    Array.from(currentTree.childNodes).forEach((node) => {
      patches.push({ type: "REMOVE_NODE", target: node });
    });
  } else if (!currentTree) {
    patches.push({ type: "KEEP_NODE", source: newTree });
  } else if (currentTree.nodeType !== newTree.nodeType) {
    // replace old by new
    patches.push({
      type: "REPLACE_NODE",
      source: currentTree,
      target: newTree,
    });
  } else if (currentTree.nodeType === 3) {
    // text
    if (currentTree.textContent !== newTree.textContent) {
      // contents
      patches.push({
        type: "REPLACE_TEXT",
        oldValue: currentTree.textContent,
        newValue: newTree.textContent,
        target: currentTree,
      });
    }
  } else {
    const toRemoveCount =
      currentTree.childNodes.length - newTree.childNodes.length;

    let currentTreeNode = currentTree.childNodes;
    if (toRemoveCount > 0) {
      const restCount = currentTree.childNodes.length - toRemoveCount;
      currentTreeNode = Array.from(currentTree.childNodes).slice(
        0,
        -toRemoveCount
      );
      const rest = Array.from(currentTree.childNodes).slice(restCount);

      rest.forEach((node) => {
        patches.push({
          type: "REMOVE_NODE",
          target: node,
        });
      });
    }
    const zippedChildren = zip(
      Array.from(newTree.childNodes),
      Array.from(currentTreeNode)
    );
    // handle fragment wrapper parent Node
    zippedChildren.forEach(([newNode, oldNode]) => {
      DomDiff(oldNode, newNode, patches, currentTree);
    });
  }
  return patches;
}

const fnMap = {
  APPEND_NODE: ({ target, parentNode }) => {
    parentNode =
      parentNode.nodeType === 11 && parentNode.targetParentNode
        ? parentNode.targetParentNode
        : parentNode;
    parentNode.appendChild(target);
  },

  REMOVE_NODE: ({ target }) => {
    console.log("-- DOM:Diff -- REMOVE_NODE --");
    console.log(target);
    console.log(target.parentNode);
    target.parentNode.removeChild(target);
  },

  REPLACE_NODE: () => {},

  REPLACE_TEXT: ({ newValue, target }) => {
    target.textContent = newValue;
  },

  KEEP_NODE: ({ source }) => source,
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
