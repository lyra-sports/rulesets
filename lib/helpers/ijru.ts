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
    const [s0 = 0, s1 = 0, s2 = 0] = scores
    const closest = s1 - s0 < s2 - s1 ? s1 + s0 : s2 + s1
    return closest / 2
  } else {
    const score = scores.reduce((a, b) => a + b)
    return score / scores.length
  }
}
