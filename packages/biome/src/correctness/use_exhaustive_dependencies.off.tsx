import { useEffect } from 'react'

export function Comp() {
	const fn = () => {}

	useEffect(() => {
		fn()
	}, [])
}
