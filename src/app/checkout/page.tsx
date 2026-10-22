"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Plus,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Trash2,
  Eye,
  AlertCircle,
  Check,
  RefreshCw,
  X,
  ShieldAlert,
  Lock,
  Package,
  Truck,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from 'react-hot-toast';
import { showWarning, showError } from "@/lib/sweetalert";

interface Address {
  id: number;
  title: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    totalAmount,
    clearCart,
    subtotal,
    savings,
    gstAmount,
    couponCode,
    couponDiscount,
    requiresPrescription,
  } = useCart();
  const { user } = useAuth();

  // Multi-step Checkout State: 1 = Address, 2 = Prescription, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PhonePe" | "">(
    "",
  );
  const [useDoseboxTokens, setUseDoseboxTokens] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [currentTokens, setCurrentTokens] = useState(0);

  // Prescription Step States
  const [attachedPrescriptionId, setAttachedPrescriptionId] = useState<number | null>(null);
  const [attachedPrescriptionFile, setAttachedPrescriptionFile] = useState<File | null>(null);
  const [attachedPrescriptionPreview, setAttachedPrescriptionPreview] = useState<string | null>(null);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [userSavedPrescriptions, setUserSavedPrescriptions] = useState<any[]>([]);
  const [isLoadingSavedRx, setIsLoadingSavedRx] = useState(false);
  const [rxTab, setRxTab] = useState<'upload' | 'saved'>('upload');
  const [rxStatus, setRxStatus] = useState<string | null>(null);
  const [rxUploadSuccess, setRxUploadSuccess] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Initialize attached prescription from storage if already attached
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = sessionStorage.getItem('attachedPrescriptionId') || localStorage.getItem('attachedPrescriptionId');
      const storedStatus = sessionStorage.getItem('attachedPrescriptionStatus') || localStorage.getItem('attachedPrescriptionStatus');
      const storedUrl = sessionStorage.getItem('attachedPrescriptionUrl') || localStorage.getItem('attachedPrescriptionUrl');
      if (storedId) {
        setAttachedPrescriptionId(parseInt(storedId, 10));
        setRxStatus(storedStatus || 'Verified');
      }
      if (storedUrl) {
        setAttachedPrescriptionPreview(storedUrl);
      } else if (storedId) {
        api.get(`/prescriptions/${storedId}`).then(res => {
          if (res.data?.success && res.data.data?.fileUrl) {
            setAttachedPrescriptionPreview(res.data.data.fileUrl);
            sessionStorage.setItem('attachedPrescriptionUrl', res.data.data.fileUrl);
            localStorage.setItem('attachedPrescriptionUrl', res.data.data.fileUrl);
          }
        }).catch(err => console.error("Error fetching attached rx url:", err));
      }
    }
  }, []);

  // Fetch user's saved prescriptions
  useEffect(() => {
    if (!user) return;
    async function loadSavedPrescriptions() {
      setIsLoadingSavedRx(true);
      try {
        const res = await api.get('/prescriptions/customer?page=1&limit=10');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setUserSavedPrescriptions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load saved prescriptions', err);
      } finally {
        setIsLoadingSavedRx(false);
      }
    }
    loadSavedPrescriptions();
  }, [user]);

  const handleRxFileChange = (file: File) => {
    setAttachedPrescriptionFile(file);
    if (file.type.startsWith('image/')) {
      setAttachedPrescriptionPreview(URL.createObjectURL(file));
    } else {
      setAttachedPrescriptionPreview(null);
    }
  };

  const handleUploadPrescription = async (fileToUpload?: File) => {
    const file = fileToUpload || attachedPrescriptionFile;
    if (!file) {
      toast.error('Please choose a prescription file to upload.');
      return;
    }

    setIsUploadingRx(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const resultData = res.data.data || {};
        const prescId = resultData.prescription?.id || resultData.id;
        const status = resultData.status || resultData.prescription?.status || 'Approved';

        if (prescId) {
          setAttachedPrescriptionId(prescId);
          setRxStatus(status);
          setRxUploadSuccess(true);
          sessionStorage.setItem('attachedPrescriptionId', prescId.toString());
          sessionStorage.setItem('attachedPrescriptionStatus', status);
          localStorage.setItem('attachedPrescriptionId', prescId.toString());
          localStorage.setItem('attachedPrescriptionStatus', status);

          const fileUrl = resultData.prescription?.fileUrl || resultData.fileUrl;
          if (fileUrl) {
            setAttachedPrescriptionPreview(fileUrl);
            sessionStorage.setItem('attachedPrescriptionUrl', fileUrl);
            localStorage.setItem('attachedPrescriptionUrl', fileUrl);
          } else if (file) {
            const localUrl = URL.createObjectURL(file);
            setAttachedPrescriptionPreview(localUrl);
            sessionStorage.setItem('attachedPrescriptionUrl', localUrl);
          }
          toast.success('Prescription uploaded & attached to order! 📄');
        } else {
          toast.error('Upload succeeded but no ID returned.');
        }
      } else {
        toast.error(res.data?.message || 'Failed to upload prescription.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Upload error');
    } finally {
      setIsUploadingRx(false);
    }
  };

  const handleSelectSavedPrescription = (presc: any) => {
    setAttachedPrescriptionId(presc.id);
    setRxStatus(presc.status || 'Verified');
    if (presc.fileUrl) {
      setAttachedPrescriptionPreview(presc.fileUrl);
      sessionStorage.setItem('attachedPrescriptionUrl', presc.fileUrl);
      localStorage.setItem('attachedPrescriptionUrl', presc.fileUrl);
    }
    sessionStorage.setItem('attachedPrescriptionId', presc.id.toString());
    sessionStorage.setItem('attachedPrescriptionStatus', presc.status || 'Verified');
    localStorage.setItem('attachedPrescriptionId', presc.id.toString());
    localStorage.setItem('attachedPrescriptionStatus', presc.status || 'Verified');
    toast.success(`Prescription #${presc.id} attached to order!`);
  };

  const handleRemovePrescription = () => {
    setAttachedPrescriptionId(null);
    setAttachedPrescriptionFile(null);
    setAttachedPrescriptionPreview(null);
    setRxStatus(null);
    setRxUploadSuccess(false);
    sessionStorage.removeItem('attachedPrescriptionId');
    sessionStorage.removeItem('attachedPrescriptionStatus');
    sessionStorage.removeItem('attachedPrescriptionUrl');
    localStorage.removeItem('attachedPrescriptionId');
    localStorage.removeItem('attachedPrescriptionStatus');
    localStorage.removeItem('attachedPrescriptionUrl');
    toast.success('Prescription removed.');
  };

  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await api.get("/account/profile");
        if (res.data?.success) {
          setCurrentTokens(res.data.data.doseboxTokens || 0);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    }
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const parsedPoints = parseInt(pointsInput) || 0;
  const pointsError =
    useDoseboxTokens && parsedPoints > currentTokens
      ? `You only have ${currentTokens} tokens available.`
      : useDoseboxTokens && parsedPoints > Math.floor(totalAmount)
        ? `You can only apply up to ${Math.floor(totalAmount)} tokens.`
        : null;

  const pointsUsed =
    useDoseboxTokens && paymentMethod === "PhonePe" && !pointsError
      ? parsedPoints
      : 0;
  const finalPayable = Math.max(0, totalAmount - pointsUsed);

  const handleToggleDoseboxTokens = (checked: boolean) => {
    setUseDoseboxTokens(checked);
    if (checked) {
      const max = currentTokens
        ? Math.min(currentTokens, Math.floor(totalAmount))
        : 0;
      setPointsInput(max.toString());
    } else {
      setPointsInput("");
    }
  };

  // Inline address creation fields
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressTitle, setAddressTitle] = useState("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");

  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);

  // Address Search & Location States
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Address Search & Location Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`,
        );
        const data = await res.json();
        setSearchResults(data || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    const address = result.address || {};
    const st =
      address.road ||
      address.suburb ||
      address.neighbourhood ||
      result.name ||
      "";
    const c = address.city || address.town || address.county || "";
    const stt = address.state || "";
    const zc = address.postcode || "";

    if (st) setStreet(st);
    if (c) setCity(c);
    if (stt) setState(stt);
    if (zc) setZipCode(zc);

    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

          let st = "",
            c = "",
            stt = "",
            zc = "";

          let usingGoogle = false;
          if (apiKey) {
            try {
              const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
              );
              const data = await res.json();
              if (data.status === "OK" && data.results[0]) {
                const result = data.results[0];
                result.address_components.forEach((component: any) => {
                  if (component.types.includes("route"))
                    st = component.long_name;
                  if (!st && component.types.includes("neighborhood"))
                    st = component.long_name;
                  if (component.types.includes("locality"))
                    c = component.long_name;
                  if (component.types.includes("administrative_area_level_1"))
                    stt = component.long_name;
                  if (component.types.includes("postal_code"))
                    zc = component.long_name;
                });
                if (!st) st = result.formatted_address.split(",")[0];
                usingGoogle = true;
              }
            } catch (e) {
              console.error("Google Maps API failed", e);
            }
          }

          if (!usingGoogle) {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              );
              const data = await res.json();

              if (data && data.address) {
                st =
                  data.address.road ||
                  data.address.suburb ||
                  data.address.neighbourhood ||
                  "";
                c =
                  data.address.city ||
                  data.address.town ||
                  data.address.county ||
                  "";
                stt = data.address.state || "";
                zc = data.address.postcode || "";
              } else {
                alert("Could not determine address from location");
                setIsFetchingLocation(false);
                return;
              }
            } catch (e) {
              alert("Could not determine address from location");
              setIsFetchingLocation(false);
              return;
            }
          }

          if (st) setStreet(st);
          if (c) setCity(c);
          if (stt) setState(stt);
          if (zc) setZipCode(zc);
        } catch (error) {
          alert("Failed to fetch address details");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        alert("Location access denied or unavailable");
        setIsFetchingLocation(false);
      },
    );
  };

  // Load addresses on mount
  useEffect(() => {
    if (!user) return;
    async function loadAddresses() {
      try {
        const res = await api.get("/account/addresses");
        if (res.data?.success && res.data.data.length > 0) {
          setAddresses(res.data.data);
          const defaultAddr = res.data.data.find((a: any) => a.isDefault);
          setSelectedAddressId(
            defaultAddr ? defaultAddr.id : res.data.data[0].id,
          );
        } else {
          setAddresses([]);
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      }
    }
    loadAddresses();
  }, [user]);

  const [hasProcessedUrl, setHasProcessedUrl] = useState(false);

  // Handle Return from PhonePe payment
  useEffect(() => {
    if (typeof window !== "undefined" && !hasProcessedUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("status");
      if (status === "success") {
        setOrderComplete(true);
        clearCart();
        sessionStorage.removeItem("attachedPrescriptionId");
        // Clean up the URL to prevent re-triggering on refresh
        router.replace("/checkout");
      } else if (status === "failed") {
        setPaymentFailed(true);
        router.replace("/checkout");
      }
      setHasProcessedUrl(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, hasProcessedUrl]);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !zipCode) {
      alert("Please fill out all address details.");
      return;
    }

    const newAddr: Address = {
      id: Date.now(),
      title: addressTitle,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: false,
    };

    setAddresses([...addresses, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowAddAddress(false);

    // Clear inputs
    setStreet("");
    setCity("");
    setState("");
    setZipCode("");
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setCurrentStep(1);
      showWarning("Shipping Address Required", "Please select or add a shipping address in Step 1.");
      return;
    }

    const prescriptionIdVal = attachedPrescriptionId || 
      (typeof window !== 'undefined' && sessionStorage.getItem("attachedPrescriptionId") 
        ? parseInt(sessionStorage.getItem("attachedPrescriptionId")!, 10) 
        : undefined);

    if (requiresPrescription && !prescriptionIdVal) {
      setCurrentStep(2);
      showWarning(
        "Prescription Required",
        "Your order contains prescription-required medicines. Please upload or choose a prescription in Step 2 to continue."
      );
      return;
    }

    if (!paymentMethod) {
      setCurrentStep(3);
      showWarning("Payment Method Required", "Please select a payment method.");
      return;
    }

    if (pointsError) {
      showWarning("Tokens Notice", pointsError);
      return;
    }

    setProcessing(true);
    try {
      const itemsPayload = cartItems.map((item) => ({
        medicineId: item.id,
        quantity: item.quantity,
      }));

      const prescriptionId = prescriptionIdVal;
      const selectedAddrObj = addresses.find((a) => a.id === selectedAddressId);

      const orderData = {
        items: itemsPayload,
        couponCode: couponCode || undefined,
        shippingAddress: selectedAddrObj,
        paymentMethod,
        prescriptionId,
        useDoseboxTokens: useDoseboxTokens && !pointsError,
        doseboxTokensToUse: pointsUsed,
      };

      const res = await api.post("/orders", orderData);

      if (res.data?.success) {
        const orderId = res.data.data.id;
        setCreatedOrderId(orderId);

        if (paymentMethod === "PhonePe") {
          try {
            const phonepeRes = await api.post("/payments/phonepe/initiate", {
              orderId,
            });
            if (
              phonepeRes.data?.success &&
              phonepeRes.data?.fullyPaidByTokens
            ) {
              // Order fully covered by DoseBox tokens — no PhonePe redirect needed
              clearCart();
              sessionStorage.removeItem("attachedPrescriptionId");
              setOrderComplete(true);
              return;
            }
            if (phonepeRes.data?.success && phonepeRes.data?.redirectUrl) {
              window.location.href = phonepeRes.data.redirectUrl;
              return; // Halt and redirect
            } else {
              showError("Payment Error", "Failed to initiate PhonePe payment.");
              setProcessing(false);
              return;
            }
          } catch (phonePeErr: any) {
            showError(
              "PhonePe Payment Error",
              phonePeErr.response?.data?.message || phonePeErr.message
            );
            setProcessing(false);
            return;
          }
        }

        // COD Flow
        clearCart();
        sessionStorage.removeItem("attachedPrescriptionId");
        setOrderComplete(true);
      } else {
        showError("Checkout Failed", res.data?.message || "Order placement failed.");
      }
    } catch (err: any) {
      showError(
        "Checkout Order Error",
        err.response?.data?.message || err.message
      );
    } finally {
      setProcessing(false);
    }
  };

  // Removed early return for orderComplete to allow modal overlay

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <ShieldCheck className="w-16 h-16 text-slate-300 mb-6" />
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
          Please Log In
        </h2>
        <p className="text-slate-500 mb-8 font-medium">
          You must be logged in to securely complete your checkout and place an
          order.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth_login_required"));
            }
          }}
          className="bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold py-3.5 px-8 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderComplete && !paymentFailed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-50 text-[#1F5C52] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Your Cart is Empty
        </h2>
        <p className="text-slate-500 mb-8 text-sm font-medium">
          You don&apos;t have any medicines in your cart yet. Add items to proceed with checkout.
        </p>
        <Link
          href="/medicines"
          className="bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold py-3.5 px-8 rounded-xl shadow-sm transition-all"
        >
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href="/cart"
            className="hover:text-slate-800 transition-colors"
          >
            Cart
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-medium">Checkout</span>
        </div>

        {/* CHECKOUT STEPPER — Connected Modern Timeline (Responsive for all devices) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          {/* Header strip with progress badge & security guarantee */}
          <div className="flex items-center justify-between gap-2 pb-3.5 sm:pb-5 mb-4 sm:mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#1F5C52] bg-[#EAF4F2] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#1F5C52]/20 shrink-0">
                Step {currentStep} of 3
              </span>
              <span className="text-xs text-slate-500 font-semibold truncate hidden xs:inline">
                {currentStep === 1 && "Select or add delivery address"}
                {currentStep === 2 && "Upload or choose doctor's prescription"}
                {currentStep === 3 && "Select payment method & complete order"}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-200/60 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">100% Secure Checkout</span>
              <span className="sm:hidden">Secure</span>
            </div>
          </div>

          {/* Connected Step Progress Track */}
          <div className="relative px-1 sm:px-6">
            {/* Background Track Line (visible on both mobile and desktop) */}
            <div className="absolute top-4 sm:top-5 left-8 sm:left-14 right-8 sm:right-14 h-0.5 bg-slate-200/90 -z-0" />

            {/* Filled Active Progress Line */}
            <div
              className="absolute top-4 sm:top-5 left-8 sm:left-14 h-0.5 bg-[#1F5C52] transition-all duration-300 -z-0"
              style={{
                width:
                  currentStep === 1
                    ? "0%"
                    : currentStep === 2
                    ? "50%"
                    : "calc(100% - 4rem)",
              }}
            />

            {/* 3 Step Interactive Nodes */}
            <div className="grid grid-cols-3 relative z-10 gap-1 sm:gap-6">
              {/* Step 1 Node: Delivery Address */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex flex-col items-center text-center group cursor-pointer transition-all focus:outline-none"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all mb-1.5 sm:mb-2.5 shrink-0 ${
                    selectedAddressId && currentStep !== 1
                      ? "bg-emerald-600 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-50"
                      : currentStep === 1
                      ? "bg-[#1F5C52] text-white shadow-md ring-2 sm:ring-4 ring-[#1F5C52]/20"
                      : "bg-white border-2 border-slate-300 text-slate-500"
                  }`}
                >
                  {selectedAddressId && currentStep !== 1 ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    "1"
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-sm font-extrabold truncate w-full transition-colors ${
                    currentStep === 1
                      ? "text-[#1F5C52]"
                      : "text-slate-900 group-hover:text-[#1F5C52]"
                  }`}
                >
                  <span className="hidden sm:inline">1. </span>Address
                </span>
                <span className="text-[9px] sm:text-xs text-slate-500 font-medium truncate w-full mt-0.5">
                  {selectedAddressId
                    ? selectedAddress
                      ? selectedAddress.title
                      : "Selected"
                    : "Add address"}
                </span>
              </button>

              {/* Step 2 Node: Doctor's Prescription */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedAddressId) {
                    toast.error("Please choose a delivery address first.");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="flex flex-col items-center text-center group cursor-pointer transition-all focus:outline-none"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all mb-1.5 sm:mb-2.5 shrink-0 ${
                    attachedPrescriptionId && currentStep !== 2
                      ? "bg-emerald-600 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-50"
                      : currentStep === 2
                      ? "bg-[#1F5C52] text-white shadow-md ring-2 sm:ring-4 ring-[#1F5C52]/20"
                      : "bg-white border-2 border-slate-300 text-slate-500"
                  }`}
                >
                  {attachedPrescriptionId && currentStep !== 2 ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    "2"
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 w-full">
                  <span
                    className={`text-[11px] sm:text-sm font-extrabold truncate transition-colors ${
                      currentStep === 2
                        ? "text-[#1F5C52]"
                        : "text-slate-900 group-hover:text-[#1F5C52]"
                    }`}
                  >
                    <span className="hidden sm:inline">2. </span>Prescription
                  </span>
                  {requiresPrescription && !attachedPrescriptionId && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 hidden sm:inline-block" />
                  )}
                </div>
                <span className="text-[9px] sm:text-xs font-medium truncate w-full mt-0.5">
                  {attachedPrescriptionId ? (
                    <span className="text-emerald-700 font-bold">Attached ✓</span>
                  ) : requiresPrescription ? (
                    <span className="text-amber-700 font-bold">Rx Required</span>
                  ) : (
                    <span className="text-slate-400">Optional</span>
                  )}
                </span>
              </button>

              {/* Step 3 Node: Payment Method */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedAddressId) {
                    toast.error("Please choose a delivery address first.");
                    return;
                  }
                  if (requiresPrescription && !attachedPrescriptionId) {
                    toast.error("Please upload or attach a prescription.");
                    setCurrentStep(2);
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="flex flex-col items-center text-center group cursor-pointer transition-all focus:outline-none"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all mb-1.5 sm:mb-2.5 shrink-0 ${
                    paymentMethod && currentStep > 3
                      ? "bg-emerald-600 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-50"
                      : currentStep === 3
                      ? "bg-[#1F5C52] text-white shadow-md ring-2 sm:ring-4 ring-[#1F5C52]/20"
                      : "bg-white border-2 border-slate-300 text-slate-500"
                  }`}
                >
                  {paymentMethod && currentStep > 3 ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    "3"
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-sm font-extrabold truncate w-full transition-colors ${
                    currentStep === 3
                      ? "text-[#1F5C52]"
                      : "text-slate-900 group-hover:text-[#1F5C52]"
                  }`}
                >
                  <span className="hidden sm:inline">3. </span>Payment
                </span>
                <span className="text-[9px] sm:text-xs text-slate-500 font-medium truncate w-full mt-0.5">
                  {paymentMethod
                    ? paymentMethod === "COD"
                      ? "COD"
                      : "Online"
                    : "Select method"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: ADDRESS & PAYMENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: DELIVERY ADDRESS */}
            <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
              currentStep === 1 ? 'border-[#1F5C52] ring-2 ring-[#1F5C52]/10' : 'border-slate-200/80'
            }`}>
              {/* Header Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    selectedAddressId && currentStep > 1
                      ? 'bg-emerald-600 text-white'
                      : currentStep === 1
                      ? 'bg-[#1F5C52] text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {selectedAddressId && currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Delivery Address</h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {currentStep === 1 
                        ? 'Select or add delivery address'
                        : selectedAddress 
                        ? `${selectedAddress.title} • ${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.zipCode}`
                        : 'Please select delivery address'}
                    </p>
                  </div>
                </div>

                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-xs font-bold text-[#1F5C52] hover:text-white hover:bg-[#1F5C52] bg-[#EAF4F2] py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddAddress ? "Cancel" : "New Address"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-[#1F5C52] hover:bg-[#EAF4F2] px-3.5 py-1.5 rounded-xl border border-[#1F5C52]/30 transition-colors shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 1 Body: Only visible when currentStep === 1 */}
              {currentStep === 1 && (
                <div className="p-5 sm:p-6 space-y-6">
                  <AnimatePresence>
                    {/* Add Address Form Minimal */}
                    {showAddAddress && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddAddress}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 mb-2">
                          <div className="relative z-10 mb-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Quick Search or Auto-Detect
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  placeholder="Search building, street or locality..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                />
                                {isSearching && (
                                  <span className="absolute right-3 top-3.5 text-xs text-slate-400">
                                    Searching...
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={handleFetchLocation}
                                disabled={isFetchingLocation}
                                className="flex-shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold text-[#1F5C52] bg-[#EAF4F2] hover:bg-[#D4ECE7] py-3 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <MapPin className="w-4 h-4" />
                                {isFetchingLocation
                                  ? "Locating..."
                                  : "Use GPS"}
                              </button>
                            </div>

                            {showSearchResults && searchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto z-20">
                                {searchResults.map((result: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectSearchResult(result)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm text-slate-700 transition-colors"
                                  >
                                    <span className="font-bold text-slate-900 block">
                                      {result.name ||
                                        (result.address &&
                                          (result.address.road ||
                                            result.address.suburb)) ||
                                        "Address"}
                                    </span>
                                    <span className="text-xs text-slate-500 block truncate mt-0.5">
                                      {result.display_name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                Label
                              </label>
                              <input
                                type="text"
                                placeholder="Home / Office / Parents"
                                value={addressTitle}
                                onChange={(e) => setAddressTitle(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                Country
                              </label>
                              <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Street Address
                            </label>
                            <input
                              type="text"
                              placeholder="Flat/House No, Building name, Street details"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                City
                              </label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                State
                              </label>
                              <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                PIN Code
                              </label>
                              <input
                                type="text"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              className="bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              Save and Select Address
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Addresses List */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No saved address found</p>
                      <p className="text-xs text-slate-400 mt-1">Click &quot;New Address&quot; above to add your delivery destination.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "border-[#1F5C52] bg-[#EAF4F2]/30 shadow-sm"
                                : "border-slate-200/80 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                                      isSelected
                                        ? "border-[#1F5C52] bg-[#1F5C52]"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                                    {addr.title}
                                  </span>
                                </div>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold text-[#1F5C52] bg-[#1F5C52]/10 px-2 py-0.5 rounded-md">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">
                                {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Continue to Step 2 Button */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedAddress ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Delivering to: {selectedAddress.title} ({selectedAddress.city})
                        </span>
                      ) : (
                        "Please select an address to continue"
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={!selectedAddressId}
                      onClick={() => {
                        if (!selectedAddressId) {
                          toast.error("Please select a delivery address.");
                          return;
                        }
                        setCurrentStep(2);
                      }}
                      className="bg-[#1F5C52] hover:bg-[#174a42] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue to Prescription</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: DOCTOR'S PRESCRIPTION SECTION */}
            <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
              currentStep === 2 ? 'border-[#1F5C52] ring-2 ring-[#1F5C52]/10' : 'border-slate-200/80'
            }`}>
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    attachedPrescriptionId && currentStep > 2
                      ? 'bg-emerald-600 text-white'
                      : currentStep === 2
                      ? 'bg-[#1F5C52] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {attachedPrescriptionId && currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Doctor&apos;s Prescription</h3>
                      {requiresPrescription ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Rx Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Optional (OTC)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {currentStep === 2
                        ? requiresPrescription ? 'Upload valid doctor prescription to proceed' : 'Attach prescription or skip for OTC items'
                        : currentStep > 2
                        ? attachedPrescriptionId ? `Prescription #${attachedPrescriptionId} attached & verified` : 'Skipped for OTC medicines'
                        : 'Complete address step to unlock'}
                    </p>
                  </div>
                </div>

                {currentStep > 2 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-[#1F5C52] hover:bg-[#EAF4F2] px-3.5 py-1.5 rounded-xl border border-[#1F5C52]/30 transition-colors shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                ) : currentStep < 2 ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked</span>
                  </div>
                ) : null}
              </div>

              {/* Step 2 Body: Only shown when currentStep === 2 */}
              {currentStep === 2 && (
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Attached Prescription Preview Card — Small Image Card */}
                  {attachedPrescriptionId ? (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/70 border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Small Card of the Uploaded Prescription Image */}
                        <div
                          onClick={() => attachedPrescriptionPreview && setSelectedImageModal(attachedPrescriptionPreview)}
                          className="relative group/thumb w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 border-emerald-300 bg-white overflow-hidden shadow-xs shrink-0 cursor-pointer flex items-center justify-center transition-transform hover:scale-[1.02]"
                          title="Click to view full prescription"
                        >
                          {attachedPrescriptionPreview ? (
                            <>
                              <img
                                src={attachedPrescriptionPreview}
                                alt={`Prescription #${attachedPrescriptionId}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://placehold.co/120x160/e2e8f0/1F5C52?text=Rx+Doc";
                                }}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white">
                                <Eye className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-wider">Preview</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-emerald-50 flex flex-col items-center justify-center text-emerald-800 p-1">
                              <FileText className="w-7 h-7 mb-1 text-emerald-700" />
                              <span className="text-[9px] font-black uppercase">Rx Doc</span>
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 bg-emerald-600 text-white p-0.5 rounded-md shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        </div>

                        {/* Prescription Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                              #RX-{attachedPrescriptionId}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {rxStatus || "Verified & Attached"}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
                            Doctor&apos;s Prescription Attached
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Tap image card to preview full size
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60">
                        {attachedPrescriptionPreview && (
                          <button
                            type="button"
                            onClick={() => setSelectedImageModal(attachedPrescriptionPreview)}
                            className="text-xs font-bold text-[#1F5C52] hover:bg-emerald-100/60 bg-white border border-[#1F5C52]/30 px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemovePrescription}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Proceed</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Prescription Upload / Select Tabs */
                    <div className="space-y-4">
                      <div className="flex border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setRxTab('upload')}
                          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            rxTab === 'upload'
                              ? 'border-[#1F5C52] text-[#1F5C52]'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Upload New Prescription
                        </button>
                        {userSavedPrescriptions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRxTab('saved')}
                            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              rxTab === 'saved'
                                ? 'border-[#1F5C52] text-[#1F5C52]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Choose from My Prescriptions ({userSavedPrescriptions.length})
                          </button>
                        )}
                      </div>

                      {rxTab === 'upload' ? (
                        <div className="space-y-4">
                          {/* Upload Box */}
                          <label className="border-2 border-dashed border-slate-200 hover:border-[#1F5C52] bg-slate-50/50 hover:bg-slate-50/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                            <Upload className="w-8 h-8 text-[#1F5C52] mb-2" />
                            <span className="text-sm font-bold text-slate-800">
                              {attachedPrescriptionFile ? attachedPrescriptionFile.name : "Click or Drag & Drop prescription here"}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                              Supports PNG, JPG, PDF up to 15MB
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleRxFileChange(e.target.files[0]);
                              }}
                            />
                          </label>

                          {attachedPrescriptionFile && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Small card preview before upload */}
                                <div
                                  onClick={() => attachedPrescriptionPreview && setSelectedImageModal(attachedPrescriptionPreview)}
                                  className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl border border-slate-300 bg-white overflow-hidden shrink-0 shadow-2xs flex items-center justify-center cursor-pointer hover:border-[#1F5C52] transition-colors"
                                  title="Click to view preview"
                                >
                                  {attachedPrescriptionPreview ? (
                                    <img src={attachedPrescriptionPreview} alt="Preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[220px]">
                                    {attachedPrescriptionFile.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {(attachedPrescriptionFile.size / 1024).toFixed(0)} KB • Ready to attach
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUploadPrescription()}
                                disabled={isUploadingRx}
                                className="w-full sm:w-auto bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                              >
                                {isUploadingRx ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload & Attach</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Saved Prescriptions List with Small Image Cards */
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                          {userSavedPrescriptions.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 flex items-center justify-between transition-colors gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Small Card Thumbnail */}
                                <div
                                  onClick={() => p.fileUrl && setSelectedImageModal(p.fileUrl)}
                                  className="w-12 h-14 rounded-lg border border-slate-300 bg-white overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs hover:border-[#1F5C52] transition-colors"
                                  title="Click to view full prescription"
                                >
                                  {p.fileUrl ? (
                                    <img src={p.fileUrl} alt={`Rx #${p.id}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-emerald-700">Rx</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    Prescription #{p.id}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Status: {p.status || "Approved"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectSavedPrescription(p)}
                                className="bg-white hover:bg-[#1F5C52] hover:text-white border border-[#1F5C52]/40 text-[#1F5C52] font-bold text-xs py-2 px-3.5 rounded-lg transition-all cursor-pointer shrink-0"
                              >
                                Select
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Step 2 Bottom Navigation — Fully Responsive */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Address</span>
                        </button>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                          {!requiresPrescription && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-slate-800 py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center hover:bg-slate-50"
                            >
                              Skip (No Rx required)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (requiresPrescription && !attachedPrescriptionId) {
                                toast.error("Please upload or choose a prescription before proceeding.");
                                return;
                              }
                              setCurrentStep(3);
                            }}
                            className="w-full sm:w-auto bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                          >
                            <span>Continue to Payment</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 3: PAYMENT METHOD */}
            <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
              currentStep === 3 ? 'border-[#1F5C52] ring-2 ring-[#1F5C52]/10' : 'border-slate-200/80'
            }`}>
              {/* Header Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    paymentMethod && currentStep === 3
                      ? 'bg-[#1F5C52] text-white'
                      : currentStep === 3
                      ? 'bg-[#1F5C52] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {paymentMethod && currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Payment Method</h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {currentStep === 3
                        ? `Selected: ${paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'PhonePe Online (UPI / Cards)'}`
                        : currentStep < 3
                        ? 'Unlocked after address & prescription verification'
                        : paymentMethod === 'COD'
                        ? 'Cash on Delivery (COD)'
                        : 'PhonePe (UPI / Cards / NetBanking)'}
                    </p>
                  </div>
                </div>

                {currentStep < 3 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF4F2] text-[#1F5C52] border border-[#1F5C52]/20 shrink-0">
                    <span>Step 3 of 3</span>
                  </span>
                )}
              </div>

              {/* Step 3 Body */}
              {currentStep === 3 && (
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Payment Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PhonePe (Online) */}
                    <div
                      onClick={() => setPaymentMethod("PhonePe")}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "PhonePe"
                          ? "border-[#1F5C52] bg-[#EAF4F2]/40 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              paymentMethod === "PhonePe" ? "border-[#1F5C52] bg-[#1F5C52]" : "border-slate-300 bg-white"
                            }`}>
                              {paymentMethod === "PhonePe" && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="font-extrabold text-slate-900 text-sm">
                              Online Payment
                            </span>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Instant & 100% Safe
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed pl-7 mb-3">
                          Pay securely via UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, or NetBanking.
                        </p>
                      </div>

                      {/* Supported Method Badges */}
                      <div className="pl-7 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">UPI</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">GPay</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">PhonePe</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Cards</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">NetBanking</span>
                      </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div
                      onClick={() => setPaymentMethod("COD")}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "COD"
                          ? "border-[#1F5C52] bg-[#EAF4F2]/40 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              paymentMethod === "COD" ? "border-[#1F5C52] bg-[#1F5C52]" : "border-slate-300 bg-white"
                            }`}>
                              {paymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="font-extrabold text-slate-900 text-sm">
                              Cash on Delivery (COD)
                            </span>
                          </div>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Pay at doorstep
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed pl-7 mb-3">
                          Pay cash or scan courier UPI QR when your medicines arrive at your doorstep.
                        </p>
                      </div>

                      <div className="pl-7 flex items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exact cash or courier QR accepted</span>
                      </div>
                    </div>
                  </div>

                  {/* DoseBox Tokens Section inside Step 3 */}
                  {user && currentTokens > 0 && paymentMethod === "PhonePe" && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <h4 className="font-extrabold text-amber-900 text-sm">
                            Redeem DoseBox Tokens
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
                          Balance: {currentTokens} Tokens (₹{currentTokens})
                        </span>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={useDoseboxTokens}
                          onChange={(e) => handleToggleDoseboxTokens(e.target.checked)}
                          className="w-4 h-4 text-[#1F5C52] border-amber-300 rounded focus:ring-[#1F5C52]"
                        />
                        <span className="text-xs sm:text-sm font-bold text-amber-900">
                          Apply DoseBox Tokens to this order
                        </span>
                      </label>

                      {useDoseboxTokens && (
                        <div className="pt-3 border-t border-amber-200/60 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative flex-1 max-w-xs">
                              <input
                                type="number"
                                min="0"
                                max={Math.min(currentTokens, totalAmount)}
                                value={pointsInput}
                                onChange={(e) => setPointsInput(e.target.value)}
                                placeholder="Enter tokens to redeem"
                                className={`w-full bg-white border ${
                                  pointsError ? "border-red-400 bg-red-50" : "border-amber-300"
                                } rounded-xl py-2 px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const maxApplicable = Math.min(currentTokens, totalAmount);
                                setPointsInput(String(maxApplicable));
                              }}
                              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              Redeem Max
                            </button>
                          </div>
                          {pointsError ? (
                            <p className="text-xs text-red-600 font-bold">{pointsError}</p>
                          ) : pointsUsed > 0 ? (
                            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              ₹{formatCurrency(pointsUsed)} discount applied from your token balance!
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3 Bottom Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(requiresPrescription ? 2 : 1)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {requiresPrescription ? "Back to Prescription" : "Back to Address"}
                    </button>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={processing || !!pointsError}
                      className="bg-[#1F5C52] hover:bg-[#174a42] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Place Order Securely • ₹{formatCurrency(finalPayable)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INVOICE BREAKDOWN SUMMARY */}
          <div className="space-y-4 lg:sticky lg:top-28 self-start">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Order Summary
                </h3>
                <span className="text-xs font-bold text-[#1F5C52] bg-[#EAF4F2] px-2.5 py-0.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List Preview */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1.5 custom-scrollbar">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/60 border border-slate-100"
                  >
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={item.image || "/images/capsule-placeholder.png"}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/80x80/e2e8f0/1F5C52?text=Rx";
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Qty: {item.quantity} × ₹{formatCurrency(item.discountPrice || item.price)}
                      </p>
                    </div>
                    <span className="font-black text-xs text-slate-900 shrink-0">
                      ₹{formatCurrency((item.discountPrice || item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span className="text-slate-900 font-bold">₹{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>DoseBox Discount</span>
                  <span className="font-bold">- ₹{formatCurrency(savings)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#1F5C52] font-bold">
                    <span>Coupon ({couponCode})</span>
                    <span>- ₹{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-slate-900 font-bold">₹{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-slate-900 font-bold">
                    {subtotal - savings > 500 ? (
                      <span className="text-emerald-600 font-extrabold uppercase">Free</span>
                    ) : (
                      "₹50.00"
                    )}
                  </span>
                </div>

                {pointsUsed > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold pt-1">
                    <span>DoseBox Tokens Applied</span>
                    <span>- ₹{formatCurrency(pointsUsed)}</span>
                  </div>
                )}
              </div>

              {/* Payable Total */}
              <div className="border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    Total Payable
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Inclusive of all taxes
                  </span>
                </div>
                <span className="font-black text-2xl text-[#1F5C52] tracking-tight">
                  ₹{formatCurrency(finalPayable)}
                </span>
              </div>

              {/* Step Context Dynamic Primary CTA */}
              <div className="pt-1">
                {currentStep === 1 && (
                  <button
                    type="button"
                    disabled={!selectedAddressId}
                    onClick={() => {
                      if (!selectedAddressId) {
                        toast.error("Please select a delivery address.");
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="w-full bg-[#1F5C52] hover:bg-[#174a42] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-sm"
                  >
                    <span>Continue to Step 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (requiresPrescription && !attachedPrescriptionId) {
                        toast.error("Please upload or attach a prescription.");
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="w-full bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-sm"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={processing || !!pointsError}
                    className="w-full bg-[#1F5C52] hover:bg-[#174a42] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-sm"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Place Order Securely</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Trust Badges Footer */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-[11px] font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Genuine Medicines Direct from Licensed Pharmacies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#1F5C52] shrink-0" />
                  <span>WHO-GDP Cold-Chain Compliant Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>256-Bit SSL Encrypted & Protected Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success & Failed Modals */}
      <AnimatePresence>
        {(orderComplete || paymentFailed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
            >
              {orderComplete ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-2 bg-brand-500" />
                  <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    Order Confirmed!
                  </h2>
                  <p className="text-slate-500 text-sm mb-4 px-4">
                    Thank you! Your order{" "}
                    {createdOrderId ? (
                      <strong className="text-slate-900">
                        #OD-{createdOrderId}
                      </strong>
                    ) : (
                      ""
                    )}{" "}
                    has been received and is being prepared.
                  </p>
                  {pointsUsed > 0 && (
                    <div className="mb-6 mx-auto bg-brand-50 border border-brand-100 rounded-lg p-3 inline-block">
                      <span className="text-sm font-bold text-brand-700 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> {pointsUsed} DoseBox
                        Tokens Applied
                      </span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Link
                      href="/account/orders"
                      className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-brand-500/20"
                    >
                      Track Order Status
                    </Link>
                    <Link
                      href="/medicines"
                      className="block w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    Payment Failed
                  </h2>
                  <p className="text-slate-500 text-sm mb-8 px-4">
                    Your payment was cancelled or failed to process. Please try
                    again using a different payment method.
                  </p>
                  <button
                    onClick={() => setPaymentFailed(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg"
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Image Full Lightbox Modal */}
      <AnimatePresence>
        {selectedImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1F5C52]" />
                  <h4 className="font-extrabold text-sm text-slate-900">Prescription Preview</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImageModal(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                <img
                  src={selectedImageModal}
                  alt="Prescription Full Preview"
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-xs"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
