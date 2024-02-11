import { useEffect } from 'react'

export function Comp() {
	const fn = () => {}

	// there is no need to include functions as dependencies.
	useEffect(() => {
		fn()
	}, [])
}
