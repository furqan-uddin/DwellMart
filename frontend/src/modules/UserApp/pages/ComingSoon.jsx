import { Link } from "react-router-dom";
import PageTransition from "../../../shared/components/PageTransition";

const ComingSoon = () => {
  return (
    <PageTransition>
      <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-gray-500 uppercase mb-3">
            NowAdial
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Coming Soon
          </h1>
          <p className="text-gray-600 mb-8">
            We are preparing something better. Please check back shortly.
          </p>

          {/* <div className="flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
            >
              Register
            </Link>
          </div> */}
        </div>
      </main>
    </PageTransition>
  );
};

export default ComingSoon;
