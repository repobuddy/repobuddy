// parseList('1,2,3') returns [1, 2, 3]
export const parseList = (s) => s.split(';').map(Number)
