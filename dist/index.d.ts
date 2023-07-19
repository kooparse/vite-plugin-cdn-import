import { Plugin } from 'vite';

interface Module {
    name: string;
    var: string;
    path: string | string[];
    css?: string | string[];
}
interface Options {
    modules: (Module | ((prodUrl: string) => Module))[];
    prodUrl?: string;
    target?: string;
}

declare function PluginImportToCDN(options: Options): Plugin[];

export { Options, PluginImportToCDN as Plugin, PluginImportToCDN as default };
