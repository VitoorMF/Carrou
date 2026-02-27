require("dotenv/config");
console.log("KEY?", !!process.env.OPENAI_API_KEY);
console.log("prefix", (process.env.OPENAI_API_KEY || "").slice(0, 8));
