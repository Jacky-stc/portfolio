import { Navigate, useLocation } from 'react-router'

export default function LegacyNewsRedirect() {
  const { pathname, search, hash } = useLocation()
  return (
    <Navigate
      replace
      to={`/zh${pathname.replace(/\/+$/, '')}${search}${hash}`}
    />
  )
}
