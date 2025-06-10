import {fileURLToPath} from "url";
import path from "path";
import {getLlama, LlamaChatSession, Llama3ChatWrapper} from "node-llama-cpp";

class LocalLLMClient {
  private static instance: LocalLLMClient | null = null;
  private static initialized: Promise<LocalLLMClient> | null = null;
  private session: LlamaChatSession | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  private async initialize() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const llama = await getLlama();
    const model = await llama.loadModel({
      modelPath: path.join(
        __dirname,
        "models",
        "Llama-3.2-3B-Instruct-Q6_K.gguf"
      ),
    });
    const context = await model.createContext();
    this.session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      chatWrapper: new Llama3ChatWrapper(), // by default, "auto" is used
    });
  }

  public static async getInstance(): Promise<LocalLLMClient> {
    if (!LocalLLMClient.initialized) {
      const client = new LocalLLMClient();
      LocalLLMClient.initialized = client
        .initialize()
        .then(() => {
          console.log("Local LLM Client initialized successfully.");
          LocalLLMClient.instance = client;
          return client;
        })
        .catch((error) => {
          console.error("Error initializing Local LLM Client:", error);
          throw error;
        });
    }
    return LocalLLMClient.initialized;
  }

  public async getStatus(): Promise<string> {
    return "Local LLM Client is running";
  }
  public responses = {
    create: async (params: any) => {
      if (!this.session) {
        throw new Error("LLM session not initialized yet.");
      }
    
      

      // Simulate a response stream
      async function* responseGenerator(this: LocalLLMClient) {
        // Use a queue to communicate between onTextChunk and the generator
        const queue: any[] = [];
        let done = false;
        let error: any = null;

        // Helper to wait for new items in the queue
        const waitForQueue = () =>
          new Promise<void>((resolve, reject) => {
            const check = () => {
              if (queue.length > 0 || done || error) {
                resolve();
              } else {
                setTimeout(check, 10);
              }
            };
            check();
          });

        // Start the prompt
        const promptPromise = this.session!.prompt(params.input, {
          onTextChunk: async (text: string) => {
            queue.push({ type: "response.output_text.delta", delta: text });
          },
        }).then((finalText: string) => {
          done = true;
          queue.push({ type: "response.output_text.done", text: finalText });
        }).catch((err: any) => {
          error = err;
        });

        // Yield items from the queue as they arrive
        while (!done || queue.length > 0) {
          await waitForQueue();
          while (queue.length > 0) {
            yield queue.shift();
            
          }
          if (error) throw error;
        }
        await promptPromise;
      }
      return responseGenerator.call(this);
    },
  };
}

export default async function getLocalLLMClient(): Promise<LocalLLMClient> {
  return LocalLLMClient.getInstance();
}
