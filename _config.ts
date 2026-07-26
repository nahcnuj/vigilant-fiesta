import lume from "https://deno.land/x/lume@v2.4.1/mod.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
});

export default site;
