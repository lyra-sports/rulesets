export const ijruAverage = (_scores: readonly number[]): number | undefined => {
  if (_scores.length === 0) return undefined
  // sort ascending
  const scores = [..._scores]
  scores.sort(function (a, b) {
    return a - b
  })

  if (scores.length >= 4) {
    scores.pop()
    scores.shift()

    const score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else if (scores.length === 3) {
    const closest = scores[1] - scores[0] < scores[2] - scores[1] ? scores[1] + scores[0] : scores[2] + scores[1]
    return closest / 2
  } else if (scores.length === 2) {
    const score = scores.reduce((a, b) => a + b)
    return score / scores.length
  } else {
    return scores[0]
  }
}
