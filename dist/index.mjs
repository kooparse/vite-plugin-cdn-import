var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/index.ts
import externalGlobals from "rollup-plugin-external-globals";
import fs from "fs";
import path from "path";
function getModuleVersion(name) {
  const pwd = process.cwd();
  const pkgFile = path.join(pwd, "node_modules", name, "package.json");
  if (fs.existsSync(pkgFile)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
    return pkgJson.version;
  }
  return "";
}
function isFullPath(path2) {
  return path2.startsWith("http:") || path2.startsWith("https:") || path2.startsWith("//") ? true : false;
}
function renderUrl(url, data) {
  const {path: path2} = data;
  if (isFullPath(path2)) {
    url = path2;
  }
  return url.replace(/\{name\}/g, data.name).replace(/\{version\}/g, data.version).replace(/\{path\}/g, path2);
}
function PluginImportToCDN(options) {
  const {
    modules = [],
    prodUrl = "https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",
    target = "<!--app-shared-deps-->"
  } = options;
  let isBuild = false;
  const data = modules.map((m) => {
    let v;
    if (typeof m === "function") {
      v = m(prodUrl);
    } else {
      v = m;
    }
    const version = getModuleVersion(v.name);
    let pathList = [];
    if (!Array.isArray(v.path)) {
      pathList.push(v.path);
    } else {
      pathList = v.path;
    }
    const data2 = __spreadProps(__spreadValues({}, v), {
      version
    });
    pathList = pathList.map((p) => {
      if (!version && !isFullPath(p)) {
        throw new Error(`modules: ${data2.name} package.json file does not exist`);
      }
      return renderUrl(prodUrl, __spreadProps(__spreadValues({}, data2), {
        path: p
      }));
    });
    let css = v.css || [];
    if (!Array.isArray(css) && css) {
      css = [css];
    }
    const cssList = !Array.isArray(css) ? [] : css.map((c) => renderUrl(prodUrl, __spreadProps(__spreadValues({}, data2), {
      path: c
    })));
    return __spreadProps(__spreadValues({}, v), {
      version,
      pathList,
      cssList
    });
  });
  const externalMap = {};
  data.forEach((v) => {
    externalMap[v.name] = v.var;
  });
  const externalLibs = Object.keys(externalMap);
  const plugins = [
    {
      name: "vite-plugin-cdn-import",
      config(_, {command}) {
        const userConfig = {
          build: {
            rollupOptions: {}
          }
        };
        if (command === "build") {
          isBuild = true;
          userConfig.build.rollupOptions = {
            external: [...externalLibs],
            plugins: [externalGlobals(externalMap)]
          };
        } else {
          isBuild = false;
        }
        return userConfig;
      },
      transformIndexHtml(html) {
        const cssCode = data.map((v) => v.cssList.map((css) => `<link href="${css}" rel="stylesheet">`).join("\n")).filter((v) => v).join("\n");
        const jsCode = !isBuild ? "" : data.map((p) => p.pathList.map((url) => `<script src="${url}"></script>`).join("\n")).join("\n");
        return html.replace(target, `${cssCode}
${jsCode}`);
      }
    }
  ];
  return plugins;
}
var src_default = PluginImportToCDN;
export {
  PluginImportToCDN as Plugin,
  src_default as default
};
