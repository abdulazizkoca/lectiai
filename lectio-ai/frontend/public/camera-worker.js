// camera-worker.js
// Advanced AI simulation for student attention tracking running in a separate thread.
let isRunning = false;
let attentionScore = 100;
let snapshotInterval = null;

self.onmessage = function(e) {
  if (e.data.type === 'START') {
    isRunning = true;
    startAnalysis();
  } else if (e.data.type === 'STOP') {
    isRunning = false;
    clearInterval(snapshotInterval);
  }
};

function startAnalysis() {
  const analyze = () => {
    if (!isRunning) return;
    
    // Simulate complex CV analysis: eye openness, head direction, phone detection
    const randomFluctuation = (Math.random() - 0.4) * 8; // Random shift
    
    // Bias towards looking at the screen, but occasionally looking away or down
    attentionScore += randomFluctuation;
    
    // Hard constraints
    if (attentionScore > 100) attentionScore = 100;
    if (attentionScore < 0) attentionScore = 0;
    
    // Determine status string for UI
    let status = 'green';
    let label = "Diqqatli";
    if (attentionScore < 40) {
      status = 'red';
      label = "Chalg'igan (Telefon/Boshqa narsa)";
    } else if (attentionScore < 70) {
      status = 'yellow';
      label = "E'tibor pasaygan";
    }

    self.postMessage({
      type: 'RESULT',
      score: Math.round(attentionScore),
      status: status,
      label: label
    });
    
    // Auto-snapshot trigger for red status (inattentive)
    if (status === 'red' && Math.random() < 0.2) {
      self.postMessage({ type: 'TAKE_SNAPSHOT', reason: "Student looking away/phone detected" });
    }

    // Run at high frequency for "near real time" updates (every 500ms)
    setTimeout(analyze, 500);
  };
  
  analyze();
}
