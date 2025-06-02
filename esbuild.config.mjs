import esbuild from "esbuild";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";

// Read CSS at build time and inject as a string into the plugin source
const css = fs.readFileSync("src/styles.css", "utf8");

const injectCssPlugin = {
    name: "inject-css-string",
    setup(build) {
        build.onLoad({ filter: /main\.ts$/ }, async (args) => {
            let source = await fs.promises.readFile(args.path, "utf8");
            // Inject a function at the top to insert the CSS at runtime
            const inject = `\n(function(){if(typeof document!==\"undefined\"){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);}})();\n`;
            source = inject + source;
            return { contents: source, loader: "ts" };
        });
    }
};

const isWatch = process.argv.includes("--watch");

const buildOptions = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron", ...builtins],
    format: "cjs",
    target: "es2020",
    outfile: "main.js",
    sourcemap: true,
    logLevel: "info",
    plugins: [injectCssPlugin],
    treeShaking: true,
    platform: "node",
    minify: false,
};

if (isWatch) {
    (async () => {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log("Watching for changes...");
        ctx.rebuild = async () => {
            try {
                await ctx.rebuild();
                console.log(`[${new Date().toLocaleTimeString()}] Rebuilt main.js`);
            } catch (error) {
                console.error("Rebuild failed:", error);
            }
        };
    })();
} else {
    esbuild.build(buildOptions);
}
