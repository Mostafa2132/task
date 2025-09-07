import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4">
      <h1 className="text-[8rem] font-extrabold animate-bounce">404</h1>
      <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-center">Oops! Page not found</h2>
      <p className="text-lg sm:text-xl mb-8 text-center max-w-md">
        Sorry, the page you are looking for doesn’t exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:bg-purple-100 transition-all duration-300"
      >
        Go Back Home
      </Link>
      <div className="mt-10">
        {/* Optional fun animation */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/564/564619.png"
          alt="lost"
          className="w-40 h-40 animate-pulse"
        />
      </div>
    </div>
  );
}
