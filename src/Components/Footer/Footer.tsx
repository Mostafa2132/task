const ProductLinks = [
  { name: "Pricing", href: "#" },
  { name: "Changelog", href: "#" },
  { name: "Docs", href: "#" },
];

const CompanyLinks = [
  { name: "About us", href: "#" },
  { name: "Blog", href: "#" },
  { name: "Careers", href: "#", badge: "We're hiring" },
  { name: "Customers", href: "#" },
];

export default function Footer() {
  return (
    <>
      {/* ========== FOOTER ========== */}
      <footer className="mt-auto bg-gray-900 w-full dark:bg-neutral-950">
        <div className="mt-auto w-full max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 lg:pt-20 mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <div className="col-span-full lg:col-span-1">
              <a
                className="flex-none text-xl font-semibold text-white focus:outline-hidden focus:opacity-80"
                href="#"
                aria-label="Brand"
              >
                ParkEasy
              </a>
            </div>
            {/* End Col */}
            <div className="col-span-1">
              <h4 className="font-semibold text-gray-100">Product</h4>
              <div className="mt-3 grid space-y-3">
                {ProductLinks.map((link) => (
                  <p key={link.name}>
                    <a
                      className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200 focus:outline-hidden focus:text-gray-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                      href={link.href}
                    >
                      {link.name}
                    </a>
                  </p>
                ))}
              </div>
            </div>
            {/* End Col */}
            <div className="col-span-1">
              <h4 className="font-semibold text-gray-100">Company</h4>
              <div className="mt-3 grid space-y-3">
                {CompanyLinks.map((link) => (
                  <p key={link.name} className="relative">
                    <a
                      className="inline-flex gap-x-2 text-gray-400 hover:text-gray-200 focus:outline-hidden focus:text-gray-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                      href={link.href}
                    >
                      {link.name}
                    </a>
                    {link.badge && (
                      <span className="inline-block ms-1 text-xs bg-blue-700 text-white py-1 px-2 rounded-lg">
                        {link.badge}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
            {/* End Col */}
            <div className="col-span-2">
              <h4 className="font-semibold text-gray-100">Stay up to date</h4>
              <form>
                <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:gap-3 bg-white rounded-lg p-2 dark:bg-neutral-900">
                  <div className="w-full">
                    <label htmlFor="hero-input" className="sr-only">
                      Subscribe
                    </label>
                    <input
                      type="text"
                      id="hero-input"
                      name="hero-input"
                      className="py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                      placeholder="Enter your email"
                    />
                  </div>
                  <a
                    className="w-full sm:w-auto whitespace-nowrap p-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                    href="#"
                  >
                    Subscribe
                  </a>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  New UI kits or big discounts. Never spam.
                </p>
              </form>
            </div>
            {/* End Col */}
          </div>
          {/* End Grid */}
          <div className="mt-5 sm:mt-12 grid gap-y-2 sm:gap-y-0 sm:flex sm:justify-between sm:items-center">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <p className="text-sm text-gray-400 dark:text-neutral-400">
                © {new Date().getFullYear()} Mostafa M.Ebrahem 🚀❤
              </p>
            </div>
            {/* End Col */}
          </div>
        </div>
      </footer>
      {/* ========== END FOOTER ========== */}
    </>
  );
}
