import { strict as assert } from "node:assert";

const data = "Harris";

const inverse = (data) => {
  let tmp = "";
  let i = 0;
  let j = data.length - 1;
  while (i !== data.length) {
    tmp += data[j];
    i++;
    j--;
  }
  return tmp;
};

console.log(inverse(data));

const compareJoin = (s1, s2) => {
  let ts1 = s1;
  let ts2 = s2;

  while (ts1 !== ts2) {}
};

const fact = (n) => {
  if (n == 1) return 1;

  return n * fact(n - 1);
};

const itFact = (n) => {
  let total = 1;

  for (let i = 1; i <= n; i++) {
    total = i * total;
  }
  return total;
};

console.log(assert.equal(fact(4), 24));
console.log(assert.equal(itFact(4), 24));
