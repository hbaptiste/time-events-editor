class Provider {
  constructor() {
    this.providersMap = new Map();
  }

  register(name, infos = {}, source) {
    infos.source = source;
    this.providersMap.set(name, infos);
  }

  useProvider(name, target) {
    const providerInfos = this.providersMap.get(name);
    if (!providerInfos) {
      return;
    }
    const { source = null, ...rest } = providerInfos;
    if (!source) {
      return false;
    }

    Object.keys(rest).map((injectedKey) => {
      if (typeof rest[injectedKey] !== "function") {
        // from source [provider] to target
        source.$binding.signals.dataChanged.connect((key, value) => {
          if (injectedKey === key) {
            target.data[injectedKey] = value; //strange
          }
        });
        const oldValue = source.data[injectedKey]; 
        source.data[injectedKey] = null;
        setTimeout(() => {
          source.data[injectedKey] = oldValue; // force update
        }, 0); 
       
        target.$binding._watchData();
      } else {
        target.$injected[injectedKey] = rest[injectedKey]; // inject methods
      }
    });
  }
}

// usage
const Instance = new Provider();

export default Instance;
