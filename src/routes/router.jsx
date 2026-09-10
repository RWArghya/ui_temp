import { createBrowserRouter } from "react-router-dom"
import Layout from "../layouts/Layout"
import Home from "../pages/Home"
import About from "../pages/About"
import Initiatives from "../pages/Initiatives"
import Enterprise from "../pages/Enterprise"
import CustomerRegister from "../pages/CustomerRegister"
import Sponsor from "../pages/Sponsor"
import Auth from "../pages/Auth"
import Profile from "../pages/Profile"
import ProfilePreview from "../pages/ProfilePreview"
import Resume from "../pages/Resume"
import AllCertificates from "../pages/AllCertificates"
import CertificateView from "../pages/CertificateView"

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
      { path: "auth", element: <Auth /> },
    ],
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
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
])


export default router

