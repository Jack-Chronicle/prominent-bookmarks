/*
ESBuild configuration for Obsidian Prominent Bookmarks plugin

Options explained:
- entryPoints: Entry file(s) for the build (src/main.ts and src/styles.css)
- bundle: Bundle all dependencies into the output
- external: Exclude these modules from the bundle (Obsidian, Electron, Node built-ins)
- format: Output format (CommonJS for Obsidian plugins)
- target: JavaScript version target (ES2020)
- outdir: Output directory (dist)
- sourcemap: Generate source maps for debugging
- logLevel: Logging verbosity (info)
- treeShaking: Remove unused code
- platform: Target platform (node)
- minify: Minify output for smaller files
- entryNames: Output filename for entry points ([name] = main or styles)
- assetNames: Output filename for assets ([name] = main or styles)
- watch: (dev only) Watch files and rebuild on changes
*/

import esbuild from "esbuild";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";
import buildOptionsPartial from "./build.options.mjs";

const defaultOptions = {
    bundle: true,
    external: ["obsidian", "electron", ...builtins],
    format: "cjs",
    target: "es2020",
    outdir: "dist",
    sourcemap: true,
    logLevel: "info",
    treeShaking: true,
    platform: "node",
    minify: true,
    entryNames: "[name]",
    assetNames: "[name]",
};

const buildOptions = { ...defaultOptions, ...buildOptionsPartial };

function copyDevBuild() {
    const configPath = path.resolve(".dev-copy.json");
    if (fs.existsSync(configPath)) {
        const { copyTo } = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (copyTo && fs.existsSync(copyTo)) {
            // Only copy main.js, styles.css, manifest.json, package.json (not .map)
            const files = [
                "dist/main.js",
                "dist/styles.css",
                "manifest.json",
                "package.json"
            ];
            for (const file of files) {
                const dest = path.join(copyTo, path.basename(file));
                fs.copyFileSync(path.resolve(file), dest);
            }
            console.log(`[dev-copy] Copied build files to ${copyTo}`);
        }
    }
}

esbuild.build(buildOptions).then(copyDevBuild);

// Only run dev build if explicitly in dev mode
if (process.env.npm_lifecycle_event === "dev") {
    (async () => {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log("Watching for changes...");
        ctx.onEnd = copyDevBuild;
    })();
}
