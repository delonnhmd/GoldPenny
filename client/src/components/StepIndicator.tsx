import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const defaultLabels = ["Loan Info", "Personal", "Contact"];
  const stepLabels = labels ?? defaultLabels;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />
        
        {/* Active Progress Bar */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="relative bg-white px-2">
              <motion.div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors duration-300
                  ${isActive ? "border-primary bg-primary text-white shadow-lg shadow-primary/30" : 
                    isCompleted ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-400 bg-white"}
                `}
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </motion.div>
              <div className={`
                absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap
                ${isActive ? "text-primary" : "text-gray-400"}
              `}>
                {stepLabels[index] ?? stepNumber}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
