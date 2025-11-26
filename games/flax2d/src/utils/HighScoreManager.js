const HIGH_SCORE_KEY = 'flax2d_highscore';                                      // key for localStorage

export function saveHighScore(score, time) {                                    // save high score if it's a new record
    const current = loadHighScore();                                            // load current high score
    if (!current                                                                // IF NO HIGH SCORE EXISTS
        || score > current.score                                                // OR NEW SCORE IS HIGHER THAN CURRENT
        || (score === current.score && time < current.time))                    // OR SAME SCORE BUT FASTER TIME
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify({ score, time }));  // save new high score
}

export function loadHighScore() {                                               // load high score from localStorage
    const data = localStorage.getItem(HIGH_SCORE_KEY);                          // get high score data
    return data ? JSON.parse(data) : null;                                      // parse and return data or null if not found
}

export function clearHighScore() {                                              // clear high score from localStorage
    localStorage.removeItem(HIGH_SCORE_KEY);                                    // remove high score item
}