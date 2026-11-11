import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageLoader } from '@/components/ui/States';

const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const Services = lazy(() => import('@/pages/Services'));
const ServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
const Doctors = lazy(() => import('@/pages/Doctors'));
const DoctorProfile = lazy(() => import('@/pages/DoctorProfile'));
const Journal = lazy(() => import('@/pages/Journal'));
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'));
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Contact = lazy(() => import('@/pages/Contact'));
const AI = lazy(() => import('@/pages/AI'));
const Legal = lazy(() => import('@/pages/Legal'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Booking = lazy(() => import('@/pages/Booking'));
const CompletePayment = lazy(() => import('@/pages/CompletePayment'));
const ConsultationRoom = lazy(() => import('@/pages/ConsultationRoom'));
const PatientDashboard = lazy(() => import('@/pages/dashboard/PatientDashboard'));
const DoctorDashboard = lazy(() => import('@/pages/dashboard/DoctorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const DoctorLogin = lazy(() => import('@/pages/auth/DoctorLogin'));
const AdminLogin = lazy(() => import('@/pages/auth/AdminLogin'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight"><PageLoader /></div>}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:slug" element={<DoctorProfile />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/:slug" element={<ArticleDetail />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact" element={<Contact />} />
          <Route path="ai" element={<AI />} />
          <Route path="payment/:id" element={<CompletePayment />} />
          <Route path="legal/:slug" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="book" element={<Booking />} />
        <Route path="consult/:id" element={<ConsultationRoom />} />

        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="doctor/login" element={<DoctorLogin />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>

        <Route
          path="dashboard"
          element={
            <ProtectedRoute role="PATIENT">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor"
          element={
            <ProtectedRoute role="DOCTOR">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
