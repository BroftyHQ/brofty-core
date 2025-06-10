import {fileURLToPath} from "url";
import path from "path";
import {getLlama, LlamaChatSession, Llama3ChatWrapper} from "node-llama-cpp";

(async ()=>{
   const llama = await getLlama();
    const model = await llama.loadModel({
      modelPath: path.join(
        __dirname,
        "models",
        "Llama-3.2-3B-Instruct-Q6_K.gguf"
      ),
    });
})();