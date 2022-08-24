const getKVStore = (name) => {
  const item = localStorage.getItem(name);
  const store = item ? JSON.parse(item) : {};

  const setValue = (key, value) => {
    console.log("store", store, key, value);
    Object.assign(store, key, value);
    localStorage.setItem(name, JSON.stringify(store));
  };

  const getValue = (key) => {
    const item = localStorage.getItem(name) || null;
    if (!item) return null;
    return JSON.parse(item)[key];
  };
  return {
    setValue,
    getValue,
  };
};

// test
const eventStore = (events) => {
  const store = getKVStore("eventStore");
  store.setValue("evt", [{ name: "myveent", start: 0, end: 11 }]);
};
eventStore();
export default getKVStore;
