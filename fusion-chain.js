// fusion-chain.js

import { promises as fs } from 'fs';

class FusionChainResult {
  constructor(topResponse, allPromptResponses, allContextFilledPrompts, performanceScores, modelNames) {
    this.topResponse = topResponse;
    this.allPromptResponses = allPromptResponses;
    this.allContextFilledPrompts = allContextFilledPrompts;
    this.performanceScores = performanceScores;
    this.modelNames = modelNames;
  }
}

class FusionChain {
  static async run(context, models, callable, prompts, evaluator, getModelName) {
    const allOutputs = [];
    const allContextFilledPrompts = [];

    for (const model of models) {
      const [outputs, contextFilledPrompts] = await MinimalChainable.run(context, model, callable, prompts);
      allOutputs.push(outputs);
      allContextFilledPrompts.push(contextFilledPrompts);
    }

    const lastOutputs = allOutputs.map(outputs => outputs[outputs.length - 1]);
    const [topResponse, performanceScores] = await evaluator(lastOutputs);

    const modelNames = models.map(getModelName);

    return new FusionChainResult(
      topResponse,
      allOutputs,
      allContextFilledPrompts,
      performanceScores,
      modelNames
    );
  }

  static async runParallel(context, models, callable, prompts, evaluator, getModelName, numWorkers = 4) {
    // Implementation for parallel execution will be added later
  }
}

class MinimalChainable {
  static async run(context, model, callable, prompts) {
    const output = [];
    const contextFilledPrompts = [];

    for (let i = 0; i < prompts.length; i++) {
      let prompt = prompts[i];

      for (const [key, value] of Object.entries(context)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      for (let j = i; j > 0; j--) {
        const previousOutput = output[i - j];

        if (typeof previousOutput === 'object' && previousOutput !== null) {
          prompt = prompt.replace(new RegExp(`{{output\\[-${j}\\]}}`, 'g'), JSON.stringify(previousOutput));

          for (const [key, value] of Object.entries(previousOutput)) {
            prompt = prompt.replace(new RegExp(`{{output\\[-${j}\\]\\.${key}}}`, 'g'), String(value));
          }
        } else {
          prompt = prompt.replace(new RegExp(`{{output\\[-${j}\\]}}`, 'g'), String(previousOutput));
        }
      }

      contextFilledPrompts.push(prompt);

      let result = await callable(model, prompt);

      output.push(result);
    }

    return [output, contextFilledPrompts];
  }

  static async toDelimTextFile(name, content) {
    let resultString = '';
    const fileName = `${name}.txt`;

    for (let i = 0; i < content.length; i++) {
      let item = content[i];
      if (typeof item === 'object') {
        item = JSON.stringify(item);
      }
      const chainTextDelim = `${'🔗'.repeat(i + 1)} -------- Prompt Chain Result #${i + 1} -------------\n\n`;
      resultString += chainTextDelim + item + '\n\n';
    }

    await fs.writeFile(fileName, resultString);
    return resultString;
  }
}

export { FusionChainResult, FusionChain, MinimalChainable };