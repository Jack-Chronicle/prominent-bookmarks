import esbuild from "esbuild";
import builtins from "builtin-modules";

const isWatch = process.argv.includes("--watch");

const buildOptions = {
    entryPoints: ["src/main.ts", "src/styles.css"],
    bundle: true,
    external: ["obsidian", "electron", ...builtins],
    format: "cjs",
    target: "es2020",
    outdir: "dist",
    sourcemap: true,
    logLevel: "info",
    treeShaking: true,
    platform: "node",
    minify: false,
};

if (isWatch) {
    (async () => {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log("Watching for changes...");
    })();
} else {
    esbuild.build(buildOptions);
}
