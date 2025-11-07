import cron from "cron";

// 1. --- CORRECTIONS ARE HERE ---
const NODE_APP_URL = process.env.RENDER_EXTERNAL_URL + "/health"; // Use Render's variable
const PYTHON_APP_URL = "https://resolvex-nlp-part.onrender.com/"; 

const pingServices = async () => {
  console.log("Pinging services to keep them awake...");
  
  try {
    const resNode = await fetch(NODE_APP_URL);
    if (resNode.ok) {
      console.log("Pinged Node.js service successfully");
    } else {
      console.log("Node.js service ping failed:", resNode.status);
    }
  } catch (error) {
    console.error("Error pinging Node.js:", error.message);
  }

  try {
    const resPython = await fetch(PYTHON_APP_URL);
    if (resPython.ok) {
      console.log("Pinged Python NLP service successfully");
    } else {
      console.log("Python service ping failed:", resPython.status);
    }
  } catch (error) {
    console.error("Error pinging Python:", error.message);
  }
};

const job = new cron.CronJob("*/14 * * * *", pingServices);

job.start(); // <-- 2. START THE JOB

export default job;