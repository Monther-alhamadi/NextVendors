import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/pages.css";
import "./styles/typography.css";
const Products = React.lazy(() => import("./pages/Products"));
const OrderReview = React.lazy(() => import("./pages/OrderReview"));
const AdminCache = React.lazy(() => import("./pages/AdminCache"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const OrderDetail = React.lazy(() => import("./pages/OrderDetail"));
const Login = React.lazy(() => import("./pages/Login"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const AffiliateDashboard = React.lazy(() => import("./pages/AffiliateDashboard"));
const AdminPayouts = React.lazy(() => import("./pages/AdminPayouts"));
const Wallet = React.lazy(() => import("./pages/Wallet")); // Module 1
import { AuthProvider } from "./store/authStore.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { ConfigProvider } from "./context/ConfigContext";
import Header from "./components/common/Header";
import MobileBottomNav from "./components/common/MobileBottomNav";
import NetworkStatus from "./components/common/NetworkStatus";
import GlobalLoader from "./components/common/GlobalLoader";
import Footer from "./components/common/Footer";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import VendorRoute from "./components/VendorRoute";
const Cart = React.lazy(() => import("./pages/Cart"));
const Orders = React.lazy(() => import("./pages/Orders"));
const Profile = React.lazy(() => import("./pages/Profile"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const Wishlist = React.lazy(() => import("./pages/Wishlist"));
const Compare = React.lazy(() => import("./pages/Compare"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const AdminProducts = React.lazy(() => import("./pages/AdminProducts"));
const AdminProductEdit = React.lazy(() =>
  import("./pages/AdminProductEditRefactor")
);
const AdminAudit = React.lazy(() => import("./pages/AdminAudit"));
const AdminLogs = React.lazy(() => import("./pages/AdminLogs"));
const AdminReviews = React.lazy(() => import("./pages/AdminReviews"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminRoles = React.lazy(() => import("./pages/AdminRoles"));
const AdminImport = React.lazy(() => import("./pages/AdminImport"));
const AdminTasks = React.lazy(() => import("./pages/AdminTasks"));
const AdminOrders = React.lazy(() => import("./pages/AdminOrders"));
const AdminRMA = React.lazy(() => import("./pages/AdminRMA"));
const AdminSettings = React.lazy(() => import("./pages/AdminSettings"));
const AdminContent = React.lazy(() => import("./pages/AdminContent"));
const AdminStoreBuilder = React.lazy(() => import("./pages/AdminStoreBuilder"));
const AdminSubscriptions = React.lazy(() => import("./pages/AdminSubscriptions"));
const AdminShipping = React.lazy(() => import("./pages/AdminShipping"));
const AdminPlans = React.lazy(() => import("./pages/AdminPlans"));
const AdminVendors = React.lazy(() => import("./pages/AdminVendors"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));
const AdminLedger = React.lazy(() => import("./pages/AdminLedger"));
const AdminSupport = React.lazy(() => import("./pages/AdminSupport"));
const AdminBroadcast = React.lazy(() => import("./pages/AdminBroadcast"));
const CustomerSupport = React.lazy(() => import("./pages/CustomerSupport"));
const BecomeVendor = React.lazy(() => import("./pages/BecomeVendor"));
const Inbox = React.lazy(() => import("./pages/Inbox"));
const VendorDashboard = React.lazy(() => import("./pages/VendorDashboard"));
const VendorCoupons = React.lazy(() => import("./pages/VendorCoupons"));
const VendorOrders = React.lazy(() => import("./pages/VendorOrders"));
const VendorStore = React.lazy(() => import("./pages/VendorStore"));

// CMS Components
const AdminAds = React.lazy(() => import("./components/cms/AdminAds"));
const DynamicBanners = React.lazy(() => import("./components/cms/DynamicBanners"));
const CategoryShowcase = React.lazy(() => import("./components/cms/CategoryShowcase"));

const VendorProducts = React.lazy(() => import("./pages/VendorProducts"));
const VendorAddProduct = React.lazy(() => import("./pages/VendorAddProduct"));
const VendorReviews = React.lazy(() => import("./pages/VendorReviews"));
const VendorSettings = React.lazy(() => import("./pages/VendorSettings"));
const VendorShipping = React.lazy(() => import("./pages/VendorShipping"));
const VendorWallet = React.lazy(() => import("./pages/VendorWallet"));
const VendorPlans = React.lazy(() => import("./pages/VendorPlans"));
const VendorAffiliate = React.lazy(() => import("./pages/VendorAffiliate"));
const VendorPayoutRequests = React.lazy(() => import("./pages/VendorPayoutRequests"));
const VendorAds = React.lazy(() => import("./pages/VendorAds"));
const VendorSupport = React.lazy(() => import("./pages/VendorSupport"));
const VendorDropshipping = React.lazy(() => import("./pages/VendorDropshipping"));
const SupplierDashboard = React.lazy(() => import("./pages/SupplierDashboard"));
import ToastProvider from "./components/common/ToastProvider";
import ConfirmProvider from "./components/common/ConfirmProvider";
const NotFound = React.lazy(() => import("./pages/NotFound"));
const CheckoutSuccess = React.lazy(() => import("./pages/CheckoutSuccess"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Addresses = React.lazy(() => import("./pages/Addresses"));
const ProfileSettings = React.lazy(() => import("./pages/ProfileSettings"));
const Landing = React.lazy(() => import("./pages/Landing"));
import { useAffiliateTracking } from "./hooks/useAffiliateTracking";

import AnnouncementBar from "./components/common/AnnouncementBar";
import MaintenanceMode from "./pages/MaintenanceMode";
import { useConfig } from "./context/ConfigContext";

function AppContent() {
  useAffiliateTracking(); // Initialize tracking
  const { config } = useConfig();
  const location = window.location || { pathname: '/' };
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (config.maintenance_mode && !isAdminRoute) {
    return <MaintenanceMode />;
  }

  return (
    <>
      {!isAdminRoute && <AnnouncementBar />}
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <MobileBottomNav />}
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={<Suspense fallback={<GlobalLoader />}><Landing /></Suspense>}
          />
          <Route
            path="/products"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <Products />
              </Suspense>
            }
          />
          <Route
            path="/products/:id"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <ProductDetail />
              </Suspense>
            }
          />
          <Route path="/cart" element={<Suspense fallback={<GlobalLoader />}><Cart /></Suspense>} />
          <Route
            path="/order-review"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <OrderReview />
              </Suspense>
            }
          />
          <Route path="/checkout" element={<Suspense fallback={<GlobalLoader />}><Checkout /></Suspense>} />
          <Route
            path="/login"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}><Orders /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/affiliate-dashboard" element={<ProtectedRoute><Suspense fallback={<GlobalLoader />}><AffiliateDashboard /></Suspense></ProtectedRoute>} />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}><OrderDetail /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<Suspense fallback={<GlobalLoader />}><Login /></Suspense>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}><Profile /></Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/settings"
            element={
              <ProtectedRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <ProfileSettings />
                 </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <Wallet />
                 </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/addresses"
            element={
              <ProtectedRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <Addresses />
                 </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<Suspense fallback={<GlobalLoader />}><About /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<GlobalLoader />}><Contact /></Suspense>} />
          
          {/* ADMIN ROUTES - All wrapped with AdminRoute which includes AdminLayout */}
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminDashboard /></Suspense></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminProducts /></Suspense></AdminRoute>} />
          <Route path="/admin/products/:id" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminProductEdit /></Suspense></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminOrders /></Suspense></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminUsers /></Suspense></AdminRoute>} />
          <Route path="/admin/roles" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminRoles /></Suspense></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminVendors /></Suspense></AdminRoute>} />
          <Route path="/admin/ads" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminAds /></Suspense></AdminRoute>} />
          <Route path="/admin/payouts" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminPayouts /></Suspense></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminAnalytics /></Suspense></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminReviews /></Suspense></AdminRoute>} />
          <Route path="/admin/import" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminImport /></Suspense></AdminRoute>} />
          <Route path="/admin/audit" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminAudit /></Suspense></AdminRoute>} />
          <Route path="/admin/logs" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminLogs /></Suspense></AdminRoute>} />
          <Route path="/admin/tasks" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminTasks /></Suspense></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminContent /></Suspense></AdminRoute>} />
          <Route path="/admin/storebuilder" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminStoreBuilder /></Suspense></AdminRoute>} />
          <Route path="/admin/cache" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminCache /></Suspense></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminSettings /></Suspense></AdminRoute>} />
          <Route path="/admin/shipping" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminShipping /></Suspense></AdminRoute>} />
          <Route path="/admin/subscriptions" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminSubscriptions /></Suspense></AdminRoute>} />
          <Route path="/admin/plans" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminPlans /></Suspense></AdminRoute>} />
          <Route path="/admin/ledger" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminLedger /></Suspense></AdminRoute>} />
          <Route path="/admin/rma" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminRMA /></Suspense></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminSupport /></Suspense></AdminRoute>} />
          <Route path="/admin/broadcast" element={<AdminRoute><Suspense fallback={<GlobalLoader />}><AdminBroadcast /></Suspense></AdminRoute>} />


          {/* VENDOR ROUTES */}
          <Route
            path="/vendor"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorDashboard />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/support"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorSupport />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/ads"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorAds />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/products"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorProducts />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/shipping"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorShipping />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/settings"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorSettings />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/reviews"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorReviews />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/wallet"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorWallet />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/plans"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorPlans />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/products/add"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorAddProduct />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/dropshipping"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorDropshipping />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/coupons"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorCoupons />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorOrders />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/affiliate"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorAffiliate />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/vendor/payouts"
            element={
              <VendorRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <VendorPayoutRequests />
                 </Suspense>
              </VendorRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <Inbox />
                 </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-vendor"
            element={
              <ProtectedRoute>
                 <Suspense fallback={<GlobalLoader />}>
                   <BecomeVendor />
                 </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<Suspense fallback={<GlobalLoader />}><SearchResults /></Suspense>} />
          <Route path="/wishlist" element={<Suspense fallback={<GlobalLoader />}><Wishlist /></Suspense>} />
          <Route path="/compare" element={<Suspense fallback={<GlobalLoader />}><Compare /></Suspense>} />
          <Route
            path="/forgot-password"
            element={<Suspense fallback={<GlobalLoader />}><ForgotPassword /></Suspense>}
          />
          <Route
            path="/reset-password/:token"
            element={<Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense>}
          />
          <Route path="/reset-password" element={<Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<GlobalLoader />}><Terms /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<GlobalLoader />}><Privacy /></Suspense>} />
          
          <Route
            path="/supplier"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <SupplierDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <CustomerSupport />
                </Suspense>
              </ProtectedRoute>
            }
          />

           <Route
            path="/store/:id"
            element={
              <Suspense fallback={<GlobalLoader />}>
                   <VendorStore />
              </Suspense>
            }
          />
          <Route path="/landing" element={<Suspense fallback={<GlobalLoader />}><Landing /></Suspense>} />
          <Route path="/success" element={<Suspense fallback={<GlobalLoader />}><CheckoutSuccess /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<GlobalLoader />}><NotFound /></Suspense>} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <ConfirmProvider>
              <ToastProvider>
                <ConfigProvider>
                  <BrowserRouter>
                    <AppContent />
                    <NetworkStatus />
                  </BrowserRouter>
                </ConfigProvider>
              </ToastProvider>
            </ConfirmProvider>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
