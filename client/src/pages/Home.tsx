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
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

// Combined schema type
type FormValues = z.infer<typeof insertLeadSchema>;

const personalLoanPurposes = [
  "Debt Consolidation",
  "Emergency",
  "Medical",
  "Other",
] as const;

export default function Home() {
  const [step, setStep] = useState(1);
  const [carStep, setCarStep] = useState(1);
  const { mutate: createLead, isPending } = useCreateLead();
  const { mutate: createCarLead, isPending: isCarPending } = useCreateLead();

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
      phone: "",
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
      phone: "",
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
      isValid = await form.trigger(["fullName", "zipCode", "email", "phone"]);
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
      isValid = await carForm.trigger(["fullName", "zipCode", "email", "phone"]);
    }

    if (isValid) {
      setCarStep((prev) => prev + 1);
    }
  };

  const onCarSubmit = (data: FormValues) => {
    createCarLead(data);
  };

  const nextStep = () => validateStep(step);
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const nextCarStep = () => validateCarStep(carStep);
  const prevCarStep = () => setCarStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
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
              
              <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Compare offers from our network of trusted lenders. Whether for debt consolidation, home improvement, or emergencies—we make it fast, simple, and free.
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

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 font-semibold">Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" type="tel" {...field} className="h-12 text-lg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            By clicking "See My Offers", you agree to our Terms of Use and Privacy Policy. You consent to receive phone calls and SMS messages from us and our partners to provide updates on your loan request.
                          </p>

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

                        <FormField
                          control={carForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-semibold">Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" type="tel" {...field} className="h-12 text-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          By clicking "See My Offers", you agree to our Terms of Use and Privacy Policy. You consent to receive phone calls and SMS messages from us and our partners to provide updates on your loan request.
                        </p>

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
              PennyFloat helps you compare personal loan and auto loan options in one place. Answer a few quick questions, then we will show partners you can check rates with. Free to use.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              We built PennyFloat to keep it simple.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Money stuff is already stressful. PennyFloat is here to make the first step easy, without confusing forms.
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
            <p className="text-slate-700 leading-relaxed mb-2">PennyFloat is a referral and comparison website.</p>
            <p className="text-slate-700 leading-relaxed">
              We are not a lender, and we do not make lending decisions. Your final approval, rate, and terms come from the partner you choose.
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
              <p>Phone: (346) 291-7636</p>
              <p>Email: support@pennyfloat.com</p>
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
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Privacy Policy (Friendly Draft)</h3>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">What we collect</h4>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>what type of loan you want (personal or auto)</li>
              <li>amount and purpose (optional)</li>
              <li>income type (optional)</li>
              <li>ZIP code/location</li>
              <li>your email/phone (only if you choose to enter it)</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may also collect basic website info (like device type, IP address, and cookies) to help prevent spam and improve the site.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">How we use it</h4>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>show relevant options</li>
              <li>connect you to partners you choose</li>
              <li>improve the site</li>
              <li>stop fraud and bots</li>
              <li>understand what is working (analytics)</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">Who we share it with</h4>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may share the information you submit with partners so you can see offers or apply. Partners may also use your info based on their own privacy policies.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">Your choices</h4>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mb-4">
              <li>You can skip optional questions.</li>
              <li>You can ask us to delete submitted info by contacting us.</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-1">Keeping your info safe</h4>
            <p className="text-slate-700 leading-relaxed">
              We use reasonable security measures, but no website can guarantee 100% protection.
            </p>
          </div>

          <div id="terms-of-service">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Terms of Service (Friendly Draft)</h3>
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
            <h3 className="text-2xl font-bold text-slate-900 mb-3">E-Consent (Friendly Draft)</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>By using PennyFloat and submitting information, you agree that notices and disclosures may be provided electronically.</li>
              <li>You can print or save anything you receive online.</li>
              <li>If you want paper copies, the lender/provider you apply with can provide them.</li>
              <li>You can stop using the site at any time.</li>
            </ul>
          </div>

          <div id="ad-disclosure">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ad Disclosure (Friendly Draft)</h3>
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
