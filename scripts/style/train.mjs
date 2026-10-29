// Submit a style LoRA only when a provider token is set and --submit is passed.
// Without a token this exits and names the variable. It does not pretend to train.

import { trainingPlan } from "../../src/style/trainers.js";

const plan = trainingPlan(process.env);
if (!plan.ok) {
  console.error(plan.blocked);
  process.exit(2);
}
const submit = process.argv.includes("--submit");
console.log(JSON.stringify({ ...plan, submit }, null, 2));
if (!submit) {
  console.error("Plan only. Pass --submit to send the job. No job was submitted.");
  process.exit(0);
}
console.error(`Refusing to submit: set the provider job from this plan on ${plan.provider}. The dataset is ${plan.dataset}.`);
process.exit(2);
