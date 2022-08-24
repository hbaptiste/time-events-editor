class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

const range = (n) => {
  if (n <= 0) return [];
  const data = [];
  while (n > 0) {
    data.push(Math.floor(Math.random() * 100));
    n--;
  }
  console.log(data);
  return data;
};

class BiTree {
  constructor() {
    this.root = null;
    this.size = 0;
  }
  addLeftNode(node) {
    if (!this.root) {
      this.root = node;
    } else {
    }
    this.size++;
  }
  /**
   * good exercice
   * fix insert
   *
   */
  insert(v) {
    if (!this.root) {
      this.root = new Node(v);
      return this.root;
    } else {
      this.insertNode(this.root, new Node(v));
    }
  }
  insertNode(root, newNode) {
    if (newNode.value < root.value) {
      // put in left
      if (root.left == null) root.left = newNode;
      else this.insertNode(root.left, newNode);
    } else {
      if (root.right == null) root.right = newNode;
      else this.insertNode(root.right, newNode);
    }
  }

  search(node, data) {
    if (!node || node === null) {
      return;
    } else if (data < node.value) {
      return this.search(node.left, data);
    } else if (data > node.value) {
      return this.search(node.right, data);
    } else {
      return node;
    }
  }

  populate(n, k) {
    let last = null;
    const range = [49, 70, 13, 20, 77, 75, 72, 45, 7, 52, 19, 17, 26, 41, 17, 83, 30, 68, 47, 22];
    for (let value of range /*(n)*/) {
      this.insert((1 + value) * k);
      last = 1 + value;
    }
    console.log(JSON.stringify(this.root));
    return last;
  }
  treeSum(node) {
    if (node == null) {
      return 0;
    }
    return node.value + this.treeSum(node.left) + this.treeSum(node.right);
  }
}
/* depth-first recursive */
const DFWalker = (node, onNode) => {
  if (!node) return;
  onNode(node);
  DFWalker(node.left, onNode);
  DFWalker(node.right, onNode);
};

/* depth-first with array */
const DFWalkerArray = (node, onNode) => {
  if (!node || node == null) return;
  let stack = [node];
  while (stack.length > 0) {
    const currentNode = stack.pop();
    onNode(currentNode);

    if (currentNode.right) {
      stack.push(currentNode.right);
    }
    if (currentNode.left) {
      stack.push(currentNode.left);
    }
  }
};
/*<---->*/
const BFWalker = (node, onNode) => {
  const queue = [node];
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode.left) {
      queue.push(currentNode.left);
    }
    if (currentNode.right) {
      queue.push(currentNode.right);
    }
    onNode(currentNode);
  }
};

const BFtreeSum = (rootNode) => {
  if (rootNode === null) {
    return 0;
  }
  let queue = [rootNode];
  let sum = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    sum = sum + current.value;
    if (current.right) {
      queue.push(current.right);
    }
    if (current.left) {
      queue.push(current.left);
    }
  }
  return sum;
};
const minValueRec = (node) => {
  if (!node) {
    return null;
  }
  let minLeft = Infinity;
  let minRight = Infinity;
  if (node.left) {
    minLeft = minValueRec(node.left);
  }
  if (node.right) {
    minRight = minValueRec(node.right);
  }
  return Math.min(node.value, minLeft, minRight);
};

const tree = new BiTree();
tree.populate(20, 1);

DFWalkerArray(tree.root, (node) => {
  console.log(node.value);
});
console.log("----------------");
BFWalker(tree.root, (node) => {
  console.log(node.value);
});

console.log(tree.treeSum(tree.root));
console.log("------------------");
console.log(BFtreeSum(tree.root));
console.log("-- min value --");
console.log(minValueRec(tree.root));

const binarySearch = (sequence, item, low, high) => {
  low = low === undefined ? 0 : low;
  high = high === undefined ? sequence.length - 1 : high;
  if (low > high) return null;
  const mid = Math.floor((low + high) / 2);
  if (item > sequence[mid]) {
    return binarySearch(sequence, item, mid + 1, high);
  }
  if (item < sequence[mid]) {
    return binarySearch(sequence, item, low, mid - 1);
  }
  return mid;
};

const seq = [1, 23, 45, 50, 56, 78, 86, 98];
const result = binarySearch(seq, 78);
console.log("-- res/u/lt --");

console.log(seq[result] == 78);
