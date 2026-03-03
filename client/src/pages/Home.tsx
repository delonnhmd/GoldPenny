import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Banknote,
  Percent,
  ChevronRight,
  ChevronLeft,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StepIndicator } from "@/components/StepIndicator";
import { useCreateLead } from "@/hooks/use-leads";
import { insertLeadSchema, creditScoreRanges, employmentStatuses, loanPurposes } from "@shared/schema";
import { api } from "@shared/routes";

// Form schemas for each step
const step1Schema = z.object({
  loanAmount: z.number().min(1000).max(50000),
  loanPurpose: z.enum(loanPurposes),
});

const step2Schema = z.object({
  creditScoreRange: z.enum(creditScoreRanges),
  employmentStatus: z.enum(employmentStatuses),
});

const step3Schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  zipCode: z.string().min(5).max(10).regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  email: z.string().email(),
});

// Combined schema type
type FormValues = z.infer<typeof insertLeadSchema>;

const personalLoanPurposes = [
  "Debt Consolidation",
  "Emergency",
  "Medical",
  "Other",
] as const;

const businessLoanSchema = z.object({
  amountRange: z.string().min(1, "This field is required."),
  purpose: z.string().min(1, "This field is required."),
  term: z.string().min(1, "This field is required."),
  creditScore: z.string().min(1, "This field is required."),
  annualSales: z.string().min(1, "This field is required."),
  businessLocation: z.string().min(1, "This field is required."),
});

type BusinessLoanFormValues = z.infer<typeof businessLoanSchema>;

const businessAmountOptions = [
  { label: "Under $10,000", value: 9000 },
  { label: "$10,000 - $25,000", value: 20000 },
  { label: "$25,000 - $75,000", value: 50000 },
  { label: "$75,000 - $250,000", value: 150000 },
  { label: "$250,000 - $500,000", value: 350000 },
  { label: "$500,000 - $1,000,000", value: 750000 },
  { label: "$1,000,000+", value: 1000000 },
] as const;

const businessIndustryOptions = [
  "Adult",
  "Advertising",
  "Aerospace / Defense",
  "Agriculture",
  "Apparel",
  "Auction",
  "Auto",
  "Auto Repair",
  "Auto Sales",
  "Aviation",
  "Banking",
  "Bar / Nightclub",
  "Beauty / Nail Salon",
  "Biotechnology",
  "Broker / Re-Sellers - Coin, Ticket, Pawn Shop",
  "Business Services",
  "Call Center",
  "Cannabis",
  "Car Rental",
  "Casino / Gambling / Sports Clubs",
  "Cell Phone Sales",
  "Chemicals",
  "Cleaning",
  "Communications",
  "Construction",
  "Consulting",
  "Contractor - General",
  "Contractor - Painting",
  "Contractor - Paving",
  "Contractor - Plumbing",
  "Contractor - Roofing",
  "Convenience Store",
  "Courier Service",
  "Day Care / Child Care",
  "Dental",
  "Design",
  "Detective",
  "Dry Cleaner",
  "E-Commerce - Holds Inventory",
  "E-Commerce - No Inventory / Drop Shipping",
  "Education",
  "Electrician",
  "Electronics",
  "Electronic Sales",
  "Energy",
  "Engineering",
  "Entertainment",
  "Environmental",
  "Environmental Services",
  "Equipment Rental",
  "Equipment Sales",
  "Equipment Service / Repair",
  "Farming / Agriculture",
  "Finance",
  "Financial - Collection / Money Services",
  "Financial Services",
  "Fire Arms / Ammunition",
  "Fitness Center",
  "Florist",
  "Food / Beverage",
  "Fuel Delivery",
  "Funeral Home",
  "Furniture Store",
  "Gas Station",
  "Government",
  "Grocery Store",
  "Healthcare",
  "Home Healthcare",
  "Hospitality",
  "HVAC",
  "Import / Export",
  "Insurance",
  "Janitorial",
  "Junk Yard",
  "Landscaping",
  "Legal Services / Law Firm",
  "Liquor Store",
  "Logging",
  "Machinery",
  "Manufacturing",
  "Marketing",
  "Massage Therapy",
  "Media",
  "Medical",
  "Medical Spa",
  "Medical Training",
  "Mineral / Oil Mining Exploration",
  "Non for Profit",
  "Not For Profit",
  "Nursery",
  "Optometrist",
  "Pest Control",
  "Pet Groomer",
  "Pharmacy",
  "Photography",
  "Plastic Surgeon",
  "Plumbing",
  "Primary Care",
  "Printing",
  "Professional Services",
  "Property Management",
  "Real Estate",
  "Recreation",
  "Religious Institute",
  "Restaurant",
  "Retail",
  "Salon",
  "School/Education",
  "Security",
  "Shipping",
  "Sign Language Interpretation",
  "Smoke / Tobacco / Vape shops",
  "Staffing",
  "Storage",
  "Technology",
  "Telecommunications",
  "Towing",
  "Transportation",
  "Travel",
  "Trucking",
  "Uber / Lyft / Taxi",
  "Utilities",
  "Veterinarian",
  "Waste Management",
  "Wholesale / Distributor",
  "Window Tinting",
  "Other",
] as const;

const businessTermOptions = [
  "Startup / New Business",
  "Less than 6 Months",
  "6-12 Months",
  "1-2 Years",
  "2-5 Years",
  "5+ Years",
] as const;

const businessAnnualSalesOptions = [
  "No Gross Sales (Startup)",
  "Under $50,000",
  "$50,000 - $100,000",
  "$100,000 - $250,000",
  "$250,000 - $500,000",
  "$500,000 - $1,000,000",
  "$1,000,000+",
] as const;

const businessLocationOptions = ["United States", "Canada"] as const;

export default function Home() {
  const [step, setStep] = useState(1);
  const [carStep, setCarStep] = useState(1);
  const [isBusinessSubmitting, setIsBusinessSubmitting] = useState(false);
  const { mutate: createLead, isPending } = useCreateLead();
  const { mutate: createCarLead, isPending: isCarPending } = useCreateLead();

  const businessForm = useForm<BusinessLoanFormValues>({
    resolver: zodResolver(businessLoanSchema),
    defaultValues: {
      amountRange: "",
      purpose: "",
      term: "",
      creditScore: "",
      annualSales: "",
      businessLocation: "",
    },
    mode: "onTouched",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      loanAmount: 5000,
      loanPurpose: "Debt Consolidation",
      creditScoreRange: "650-719",
      employmentStatus: "Employed",
      fullName: "",
      zipCode: "",
      email: "",
    },
    mode: "onChange",
  });

  const carForm = useForm<FormValues>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      loanAmount: 15000,
      loanPurpose: "Car Buying",
      creditScoreRange: "650-719",
      employmentStatus: "Employed",
      fullName: "",
      zipCode: "",
      email: "",
    },
    mode: "onChange",
  });

  const validateStep = async (currentStep: number) => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger(["loanAmount", "loanPurpose"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger(["creditScoreRange", "employmentStatus"]);
    } else {
      isValid = await form.trigger(["fullName", "zipCode", "email"]);
    }
    
    if (isValid) {
      setStep(prev => prev + 1);
    }
  };

  const onSubmit = (data: FormValues) => {
    createLead(data);
  };

  const validateCarStep = async (currentStep: number) => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await carForm.trigger(["loanAmount", "loanPurpose"]);
    } else if (currentStep === 2) {
      isValid = await carForm.trigger(["creditScoreRange", "employmentStatus"]);
    } else {
      isValid = await carForm.trigger(["fullName", "zipCode", "email"]);
    }

    if (isValid) {
      setCarStep((prev) => prev + 1);
    }
  };

  const onCarSubmit = (data: FormValues) => {
    createCarLead(data);
  };

  const onBusinessSubmit = async (data: BusinessLoanFormValues) => {
    setIsBusinessSubmitting(true);

    const matchedAmount = businessAmountOptions.find((option) => option.label === data.amountRange);
    const amount = matchedAmount?.value ?? 50000;

    const locationParams = new URLSearchParams(window.location.search);

    try {
      const response = await fetch(api.leads.routeDecision.path, {
        method: api.leads.routeDecision.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_location: data.businessLocation,
          industry: data.purpose,
          loan_amount: amount,
          credit_score: data.creditScore,
          annual_sales: data.annualSales,
          time_in_business: data.term,
          sub_id_1: locationParams.get("sub_id_1") ?? undefined,
          sub_id_2: locationParams.get("sub_id_2") ?? undefined,
        }),
      });

      if (response.ok) {
        const result = (await response.json()) as { targetUrl: string };
        window.location.href = result.targetUrl;
        return;
      }
    } catch (error) {
      console.error("Business route decision failed", error);
    } finally {
      setIsBusinessSubmitting(false);
    }

    const fallbackSearchParams = new URLSearchParams({
      name: "Business Owner",
      purpose: data.purpose,
      amount: String(amount),
      score: data.creditScore,
    });

    window.location.href = `/offers?${fallbackSearchParams.toString()}`;
  };

  const nextStep = () => validateStep(step);
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const nextCarStep = () => validateCarStep(carStep);
  const prevCarStep = () => setCarStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-80" />
          {/* Abstract background blobs */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="container relative z-10 mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Hero Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <img
                  src="/logo.png"
                  alt="PennyFloat logo"
                  className="w-40 h-40 md:w-48 md:h-48 object-contain"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/favicon.png";
                  }}
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>No Impact on Your Credit Score</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight font-display">
                Check Personal Loan <br />
                Offers in <span className="text-primary relative inline-block">
                  Minutes
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-400 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 mb-4 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                We compare and explain short-term cash tools so borrowers can make informed decisions.
              </p>
              <p className="text-base text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                PennyFloat is an educational comparison resource. We focus on clear explanations of costs, terms, and trade-offs so you can review options with more confidence.
              </p>
              <p className="text-sm text-slate-500 mb-8 max-w-2xl mx-auto lg:mx-0">
                Impact-Site-Verification: 60e7108b-a262-4838-b750-2bda07b40c9d
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => document.getElementById("car-loan")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Car Loan Options
                </Button>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>256-bit Secure</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>2 Minute Process</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Banknote className="w-5 h-5 text-primary" />
                  <span>Funding as fast as 24h</span>
                </div>
              </div>
            </div>

            {/* Application Form Card */}
            <div id="apply" className="flex-1 w-full max-w-md lg:max-w-lg">
              <Card className="p-6 md:p-8 shadow-2xl border-slate-100 bg-white/90 backdrop-blur rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />
                
                <h3 className="text-2xl font-bold text-center mb-6 font-display text-slate-800">Check Your Rate</h3>
                
                <StepIndicator currentStep={step} totalSteps={3} />

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <AnimatePresence mode="wait">
                      
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <FormField
                            control={form.control}
                            name="loanAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-slate-700">How much do you need?</FormLabel>
                                <div className="pt-2 pb-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl font-bold text-primary">${field.value.toLocaleString()}</span>
                                    <span className="text-sm text-slate-500">Min: $1,000 — Max: $50,000</span>
                                  </div>
                                  <Slider
                                    min={1000}
                                    max={50000}
                                    step={100}
                                    value={[field.value]}
                                    onValueChange={(val) => field.onChange(val[0])}
                                    className="py-4"
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="loanPurpose"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-slate-700">What is this loan for?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 text-base">
                                      <SelectValue placeholder="Select a purpose" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {personalLoanPurposes.map((p) => (
                                      <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="button" onClick={nextStep} className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            Next Step <ChevronRight className="ml-2 w-5 h-5" />
                          </Button>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <FormField
                            control={form.control}
                            name="creditScoreRange"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-slate-700">Estimated Credit Score</FormLabel>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                  {creditScoreRanges.map((range) => (
                                    <div
                                      key={range}
                                      onClick={() => field.onChange(range)}
                                      className={`
                                        cursor-pointer p-4 rounded-xl border-2 text-center transition-all duration-200
                                        ${field.value === range 
                                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm" 
                                          : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"}
                                      `}
                                    >
                                      {range}
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="employmentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-slate-700">Employment Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 text-base">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employmentStatuses.map((s) => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12">
                              <ChevronLeft className="mr-2 w-4 h-4" /> Back
                            </Button>
                            <Button type="button" onClick={nextStep} className="flex-[2] h-12 text-lg font-semibold bg-primary hover:bg-primary/90">
                              Next Step <ChevronRight className="ml-2 w-5 h-5" />
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} className="h-12 text-lg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">ZIP Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="12345" {...field} className="h-12 text-lg" maxLength={10} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="you@example.com" type="email" {...field} className="h-12 text-lg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={prevStep} disabled={isPending} className="flex-1 h-12">
                              <ChevronLeft className="mr-2 w-4 h-4" /> Back
                            </Button>
                            <Button type="submit" disabled={isPending} className="flex-[2] h-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                              {isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                                  Processing...
                                </>
                              ) : (
                                <>
                                  See My Offers <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                              )}
                            </Button>
                          </div>

                          <p className="text-xs text-slate-500 mt-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            By clicking "See My Offers," you agree to our Terms and Privacy Policy. By submitting your email address through our website, you consent to receive communications from us related to financial tools, comparisons, and educational content. You may unsubscribe at any time using the unsubscribe link included in our emails.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Car Loan Form Section */}
      <section id="car-loan" className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-4">Car Loan & Car Refinance</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Apply for a car loan or refinance your current auto loan with the same fast, secure process.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="p-6 md:p-8 shadow-2xl border-slate-100 bg-white rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />

              <h3 className="text-2xl font-bold text-center mb-6 font-display text-slate-800">Check Your Car Loan Rate</h3>

              <StepIndicator currentStep={carStep} totalSteps={3} />

              <Form {...carForm}>
                <form onSubmit={carForm.handleSubmit(onCarSubmit)} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {carStep === 1 && (
                      <motion.div
                        key="car-step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <FormField
                          control={carForm.control}
                          name="loanPurpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-slate-700">Loan Type</FormLabel>
                              <FormControl>
                                <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                  <TabsList className="grid w-full grid-cols-2 h-12">
                                    <TabsTrigger value="Car Buying" className="text-base">Buying</TabsTrigger>
                                    <TabsTrigger value="Car Refinance" className="text-base">Refinance</TabsTrigger>
                                  </TabsList>
                                </Tabs>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={carForm.control}
                          name="loanAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-slate-700">How much do you need?</FormLabel>
                              <div className="pt-2 pb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-3xl font-bold text-primary">${field.value.toLocaleString()}</span>
                                  <span className="text-sm text-slate-500">Min: $1,000 — Max: $50,000</span>
                                </div>
                                <Slider
                                  min={1000}
                                  max={50000}
                                  step={100}
                                  value={[field.value]}
                                  onValueChange={(val) => field.onChange(val[0])}
                                  className="py-4"
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="button" onClick={nextCarStep} className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                          Next Step <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                      </motion.div>
                    )}

                    {carStep === 2 && (
                      <motion.div
                        key="car-step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <FormField
                          control={carForm.control}
                          name="creditScoreRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-slate-700">Estimated Credit Score</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {creditScoreRanges.map((range) => (
                                  <div
                                    key={range}
                                    onClick={() => field.onChange(range)}
                                    className={`
                                      cursor-pointer p-4 rounded-xl border-2 text-center transition-all duration-200
                                      ${field.value === range
                                        ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"}
                                    `}
                                  >
                                    {range}
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={carForm.control}
                          name="employmentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-slate-700">Employment Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {employmentStatuses.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={prevCarStep} className="flex-1 h-12">
                            <ChevronLeft className="mr-2 w-4 h-4" /> Back
                          </Button>
                          <Button type="button" onClick={nextCarStep} className="flex-[2] h-12 text-lg font-semibold bg-primary hover:bg-primary/90">
                            Next Step <ChevronRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {carStep === 3 && (
                      <motion.div
                        key="car-step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <FormField
                          control={carForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-semibold">Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="h-12 text-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={carForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-semibold">ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" {...field} className="h-12 text-lg" maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={carForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-semibold">Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" type="email" {...field} className="h-12 text-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={prevCarStep} disabled={isCarPending} className="flex-1 h-12">
                            <ChevronLeft className="mr-2 w-4 h-4" /> Back
                          </Button>
                          <Button type="submit" disabled={isCarPending} className="flex-[2] h-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                            {isCarPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                See My Offers <ArrowRight className="ml-2 w-5 h-5" />
                              </>
                            )}
                          </Button>
                        </div>

                        <p className="text-xs text-slate-500 mt-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          By clicking "See My Offers," you agree to our Terms and Privacy Policy. By submitting your email address through our website, you consent to receive communications from us related to financial tools, comparisons, and educational content. You may unsubscribe at any time using the unsubscribe link included in our emails.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </section>

      <section className="pb-8 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-lg text-slate-600 max-w-3xl mx-auto text-center leading-relaxed">
            Compare auto loan offers from our network of trusted partners. Whether you’re refinancing, buying a new car, or buying used—we make it fast, simple, and free.
          </p>
        </div>
      </section>

      <section id="business-loan" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-4">Business Loan Solutions</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Get pre-qualified in seconds and review business funding options tailored to your goals.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="p-6 md:p-8 shadow-2xl border-slate-100 bg-white rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />

              <h3 className="text-2xl font-bold text-center mb-6 font-display text-slate-800">Get Qualified</h3>

              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-5">
                  <FormField
                    control={businessForm.control}
                    name="amountRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">How much does your business need?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Amount" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessAmountOptions.map((option) => (
                              <SelectItem key={option.label} value={option.label}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">What industry is your business in?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessIndustryOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">How long have you been in business?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Time in business" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTermOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="creditScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">What is your credit score?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Credit score" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {creditScoreRanges.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="annualSales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">What are your annual sales?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Annual sales" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessAnnualSalesOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="businessLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-700">Where is your business located?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Business location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessLocationOptions.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isBusinessSubmitting} className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    {isBusinessSubmitting ? "Routing..." : "Get Qualified"}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-4">How PennyFloat Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Get the funds you need in three simple steps. We've streamlined the process to make borrowing easy and transparent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                icon: <DollarSign className="w-8 h-8 text-primary" />, 
                title: "Check Your Rate", 
                desc: "Fill out our simple online form to see your personalized loan offers without affecting your credit score." 
              },
              { 
                icon: <TrendingUp className="w-8 h-8 text-primary" />, 
                title: "Choose Your Loan", 
                desc: "Compare rates, terms, and payments from our network of trusted lenders and pick the best option for you." 
              },
              { 
                icon: <Banknote className="w-8 h-8 text-primary" />, 
                title: "Get Funded Fast", 
                desc: "Once approved, funds are typically deposited directly into your bank account as soon as the next business day." 
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Benefits Section */}
      <section id="benefits" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">Why Choose PennyFloat?</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We believe financial freedom should be accessible to everyone. Our platform connects you with lenders who look beyond just your credit score.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Competitive rates from 5.99% APR",
                  "Loan amounts up to $50,000",
                  "No prepayment penalties",
                  "Secure & confidential process"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10">
                <Button 
                  size="lg" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Get Started Now
                </Button>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 transform translate-y-8">
                  <div className="text-4xl font-bold text-emerald-400 mb-1">200+</div>
                  <div className="text-sm text-slate-400">Trusted Lending Partners</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <div className="text-4xl font-bold text-blue-400 mb-1">Up to $200K</div>
                  <div className="text-sm text-slate-400">Auto Loan Amounts Available</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 transform translate-y-8">
                  <div className="text-4xl font-bold text-purple-400 mb-1">98%</div>
                  <div className="text-sm text-slate-400">Satisfaction Rate</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <div className="text-4xl font-bold text-yellow-400 mb-1">24h</div>
                  <div className="text-sm text-slate-400">Avg. Funding Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-12 text-slate-900">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: "Will checking my rate affect my credit score?", a: "No. Checking your rate with PennyFloat triggers a 'soft inquiry' on your credit report, which is visible only to you and does not affect your credit score." },
              { q: "How fast can I get the money?", a: "Once you accept a loan offer and complete the lender's verification process, funds are typically deposited into your bank account as soon as the next business day." },
              { q: "What can I use a personal loan for?", a: "You can use a personal loan for almost anything, including debt consolidation, home improvements, medical expenses, weddings, or vacations." },
              { q: "Is my personal information secure?", a: "Yes. We use industry-standard 256-bit SSL encryption to protect your personal information. We treat your data with the highest level of security and privacy." }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary/30 transition-colors shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-3">
                  <span className="text-primary mt-1"><Percent className="w-4 h-4" /></span>
                  {item.q}
                </h3>
                <p className="text-slate-600 pl-7">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about-us" className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          <div>
            <h2 className="text-3xl font-bold font-display text-slate-900 mb-4">About Us</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We compare and explain short-term cash tools so borrowers can make informed decisions.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              PennyFloat, operated by MD Media LLC and led by Minh Ho, is built to help people understand borrowing choices in plain language. We publish educational content and comparison tools to explain payments, total costs, and key terms.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Our goal is clarity, not pressure. We do not provide financial advice, and we encourage borrowers to read lender disclosures carefully before choosing any product.
            </p>
            <p className="text-slate-700 leading-relaxed mt-4">
              All content is reviewed and updated periodically to reflect current market conditions and product changes.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">What you can do here</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Explore personal loan options (debt consolidation, home repairs, emergencies, and more)</li>
              <li>Explore auto loan options (refinance, or finance a new/used car)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">What PennyFloat is (and is not)</h3>
            <p className="text-slate-700 leading-relaxed mb-2">PennyFloat is an educational comparison website.</p>
            <p className="text-slate-700 leading-relaxed">
              We are not a lender, and we do not make lending decisions. Final approval, APR, fees, and repayment terms come from the lender or provider you choose.
            </p>
          </div>

          <div id="how-it-works-info">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">How It Works</h3>
            <ol className="list-decimal pl-6 space-y-3 text-slate-700">
              <li>
                <span className="font-semibold text-slate-900">Tell us what you need:</span> Pick personal loan or auto loan and answer a few quick questions.
              </li>
              <li>
                <span className="font-semibold text-slate-900">See your options:</span> We will show offers and partners that may match your situation.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Finish with the partner:</span> When you click an offer, you will go to the partner website to review details and apply.
              </li>
            </ol>
            <p className="text-slate-600 mt-4">
              Heads up: Rates and approvals depend on your credit, income, state, and the lender rules.
            </p>
          </div>

          <div id="lender-network">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Lender Network</h3>
            <p className="text-slate-700 leading-relaxed mb-3">
              We work with a group of trusted partners, including lenders, lending platforms, and financial services, so you can compare options without starting from scratch.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Some partners focus on personal loans</li>
              <li>Some focus on auto refinance or car purchase</li>
              <li>Some may offer other financial tools</li>
            </ul>
            <p className="text-slate-600 mt-4">
              Not every option is available everywhere. Offers can change by state and your personal profile.
            </p>
          </div>

          <div id="contact">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Contact</h3>
            <p className="text-slate-700 mb-3">Need help or have a question? We are here.</p>
            <div className="space-y-1 text-slate-700">
              <p>Business Entity: MD Media LLC</p>
              <p>Publisher: Minh Ho</p>
              <p>Phone: (346) 291-7636</p>
              <p>Email: admin@pennyfloat.com</p>
              <p>Hours: Mon-Fri, 9am-5pm CT</p>
            </div>
            <div className="mt-4">
              <p className="text-slate-700 mb-2">If something looks wrong on the site, tell us:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li>what page you were on</li>
                <li>what happened</li>
                <li>a screenshot if you can</li>
              </ul>
            </div>
          </div>

          <div id="privacy-policy">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Privacy Policy</h3>
            <p className="text-slate-700 leading-relaxed mb-2"><span className="font-semibold text-slate-900">Effective Date:</span> February 28, 2026</p>
            <p className="text-slate-700 leading-relaxed mb-4"><span className="font-semibold text-slate-900">Last Updated:</span> February 28, 2026</p>
            <p className="text-slate-700 leading-relaxed mb-4">
              PennyFloat is a U.S.-based financial comparison website operated by MD Media LLC in Texas. We provide educational content and comparison tools related to cash advance apps, personal loans, and small business funding.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">1) We Are Not a Lender</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              PennyFloat and MD Media LLC are not lenders, banks, credit unions, or financial institutions. We do not make loan offers, underwrite loans, make credit decisions, or set loan terms. We have no control over and are not responsible for lender underwriting decisions, rates, fees, terms, or funding timelines.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">Data Controller</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              MD Media LLC is the data controller for personal information collected through this website.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">2) Information We Collect</h4>
            <p className="text-slate-700 leading-relaxed mb-2">Information you may provide includes:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-3">
              <li>Name</li>
              <li>Email address</li>
              <li>Requested loan amount</li>
              <li>Income type</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-2">We may also collect information automatically, including:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>IP address, browser type, and device details</li>
              <li>Pages viewed, links clicked, and referral sources</li>
              <li>Cookie identifiers and similar tracking data</li>
            </ul>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">3) How We Use Information</h4>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>Provide educational comparison content and site functionality</li>
              <li>Respond to requests and support questions</li>
              <li>Match submitted information with potential lending partners</li>
              <li>Analyze and improve website performance and content quality</li>
              <li>Help prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">4) Cookies and Tracking Technologies</h4>
            <p className="text-slate-700 leading-relaxed mb-2">
              We use cookies, pixels, and similar technologies for analytics, site operation, and marketing measurement.
            </p>
            <p className="text-slate-700 leading-relaxed mb-2">Tools currently include:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>Google Analytics</li>
              <li>Meta Pixel</li>
            </ul>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">5) Affiliate Disclosure</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              Some links on our site are affiliate links. If you click a link and complete certain actions, we may receive compensation. This does not change our goal of providing clear educational comparisons.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">6) Third-Party Sharing</h4>
            <p className="text-slate-700 leading-relaxed mb-2">
              We may share submitted information with third-party lending partners or financial service providers solely for the purpose of potential matching or referral opportunities.
            </p>
            <p className="text-slate-700 leading-relaxed mb-2">
              We do not sell personal information for monetary consideration.
            </p>
            <p className="text-slate-700 leading-relaxed mb-2">We may also share data with:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>Analytics and advertising providers</li>
              <li>Technology and hosting service providers</li>
              <li>Professional advisors and authorities when required by law</li>
            </ul>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">7) Data Protection</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              We use reasonable administrative, technical, and physical safeguards to protect your information. No method of internet transmission or storage is 100% secure, so absolute security cannot be guaranteed.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              We retain personal information only as long as reasonably necessary for business, legal, or compliance purposes.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">Children's Privacy</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              This website is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">8) Your Privacy Rights</h4>
            <p className="text-slate-700 leading-relaxed mb-2">Depending on your state, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>Request access to personal information we hold about you</li>
              <li>Request correction or deletion of personal information</li>
              <li>Opt out of certain data-sharing uses where applicable</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-4">
              Residents of certain states, including California, Virginia, Colorado, Connecticut, and others, may have additional rights under applicable state privacy laws.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">Communications</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              We comply with the CAN-SPAM Act and provide unsubscribe options in marketing emails.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">9) Communications (Email Only)</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              By submitting your email address through our website, you consent to receive communications from us related to financial tools, comparisons, and educational content. You may unsubscribe at any time using the unsubscribe link included in our emails.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              We comply with the CAN-SPAM Act. All marketing emails include a clear unsubscribe option.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              We do not engage in telemarketing and do not sell phone-based lead data.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">10) Contact</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              For privacy questions or requests, contact us at: <span className="font-semibold text-slate-900">admin@pennyfloat.com</span>
            </p>

            <p className="text-slate-700 leading-relaxed mb-4">
              Content on this site is for informational purposes only and does not constitute financial advice.
            </p>

            <h4 className="text-lg font-semibold text-slate-900 mb-1">11) Policy Updates</h4>
            <p className="text-slate-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
            </p>
          </div>

          <div id="terms-of-service">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Terms of Service</h3>
            <p className="text-slate-700 leading-relaxed mb-3">By using PennyFloat, you agree to these basics:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li><span className="font-semibold text-slate-900">What PennyFloat does:</span> We help you compare options and connect to third-party partners.</li>
              <li><span className="font-semibold text-slate-900">No promises:</span> We cannot promise approval, rates, or specific offers.</li>
              <li><span className="font-semibold text-slate-900">Third-party partners:</span> When you click out to a partner site, their terms and privacy policy apply. PennyFloat is not responsible for their products or decisions.</li>
              <li><span className="font-semibold text-slate-900">Use the site fairly:</span> Please do not misuse the site (spam, hacking, scraping, fraud).</li>
              <li><span className="font-semibold text-slate-900">Limits:</span> To the extent allowed by law, PennyFloat is not liable for losses related to your use of partner products or the site.</li>
              <li><span className="font-semibold text-slate-900">Updates:</span> We may update these terms by posting a new version on this page.</li>
            </ul>
          </div>

          <div id="e-consent">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">E-Consent</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>By using PennyFloat and submitting information, you agree that notices and disclosures may be provided electronically.</li>
              <li>You can print or save anything you receive online.</li>
              <li>If you want paper copies, the lender/provider you apply with can provide them.</li>
              <li>You can stop using the site at any time.</li>
            </ul>
          </div>

          <div id="ad-disclosure">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ad Disclosure</h3>
            <p className="text-slate-700 leading-relaxed mb-3">
              PennyFloat is free because we may earn money from advertising.
            </p>
            <p className="text-slate-700 leading-relaxed mb-3">That means we might get paid when you:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-3">
              <li>click a link</li>
              <li>submit a request</li>
              <li>or apply with a partner</li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              This may affect which offers show up and how they are ordered. We still try to keep things simple and helpful.
            </p>
          </div>

          <div id="apr-disclosure">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">APR Disclosure</h3>
            <p className="text-slate-700 leading-relaxed mb-3">
              APR (interest rate) and terms depend on the lender and your personal situation (credit, income, and state rules). PennyFloat does not set rates or approve loans.
            </p>
            <p className="text-slate-700 leading-relaxed">
              PennyFloat is not a lender, loan broker, or agent for any lender or broker. We are an advertising referral service that connects users to participating lenders and financial service providers. Final approval and loan terms come from the provider you choose.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Helper icons
function Check(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
