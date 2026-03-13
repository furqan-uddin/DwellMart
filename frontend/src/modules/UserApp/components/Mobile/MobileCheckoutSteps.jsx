import { FiCheck } from "react-icons/fi";

const MobileCheckoutSteps = ({ currentStep, totalSteps = 3 }) => {
  return (
    <div className="flex items-center justify-center mb-6 px-4">
      <div className="flex items-center gap-2 w-full max-w-md ml-8">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "gradient-green text-white"
                      : isCurrent
                      ? "gradient-green text-white ring-4 ring-primary-200"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                  {isCompleted ? <FiCheck className="text-lg" /> : step}
                </div>
                <span
                  className={`text-xs font-semibold mt-2 ${
                    isCurrent
                      ? "text-primary-600"
                      : isCompleted
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}>
                  Step {step}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 w-28 ml-10 mr-0 -mt-6 transition-all ${
                    isCompleted ? "gradient-green" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCheckoutSteps;
