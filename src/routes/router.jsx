import { createBrowserRouter } from "react-router-dom"
import Layout from "../layouts/Layout"
import Home from "../pages/Home"
import About from "../pages/About"
import Initiatives from "../pages/Initiatives"
import Enterprise from "../pages/Enterprise"
import CustomerRegister from "../pages/CustomerRegister"
import Sponsor from "../pages/Sponsor"
import Auth from "../pages/Auth"
import Onboarding from "../pages/Onboarding"
import Dashboard from "../dashboard/Dashboard"
import ProfilePreview from "../pages/ProfilePreview"
import Resume from "../pages/Resume"
import AllCertificates from "../pages/AllCertificates"
import CertificateView from "../pages/CertificateView"
import Terms from "../pages/Terms"
import Privacy from "../pages/Privacy"
import NotFound from "../pages/NotFound"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "initiatives", element: <Initiatives /> },
      { path: "enterprise", element: <Enterprise /> },
      { path: "customer-register", element: <CustomerRegister /> },
      { path: "sponsor", element: <Sponsor /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    // wildcard: Dashboard.jsx's own `sub` logic handles /dashboard/workspace,
    // /dashboard/initiative and /dashboard/evaluate — without the wildcard
    // the router 404s on every "Continue"/"View" click before Dashboard
    // ever sees the path.
    path: "/dashboard/*",
    element: <Dashboard />,
  },
  {
    // Profile rendered inside the Dashboard shell (sidebar + appbar stay visible)
    path: "/profile",
    element: <Dashboard defaultView="profile" />,
  },
  {
    // Sub-pages are standalone (no dashboard shell needed)
    path: "/profile/preview",
    element: <ProfilePreview />,
  },
  {
    path: "/profile/resume",
    element: <Resume />,
  },
  {
    path: "/profile/certificates",
    element: <AllCertificates />,
  },
  {
    path: "/profile/certificate/:certId",
    element: <CertificateView />,
  },
  {
    // catch-all: without this, any unmatched URL (typo, stale link, old
    // bookmark) fell through to React Router's raw default error screen
    // instead of a branded page.
    path: "*",
    element: <NotFound />,
  },
])


export default router

