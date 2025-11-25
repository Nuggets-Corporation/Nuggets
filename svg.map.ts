interface svgModule {
  default: any;
}

const svgModules = import.meta.glob('/public/assets/svg/*.svg', { eager: true });

export const svgMap = Object.keys(svgModules).reduce((map, path) => {
  const name = path.split('/').pop()?.replace('.svg', '');
  const module = svgModules[path] as svgModule;
  if (name) {
    map.set(name, module.default); 
  }
  return map;
}, new Map<string, any>());