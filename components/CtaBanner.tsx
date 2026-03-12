import Link from 'next/link';

export default function CtaBanner() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4">
          Ready to cast your next production?
        </h2>
        <p className="text-indigo-200 text-lg mb-10">
          Join 2,000+ studios already using Cast to build their AI films.
        </p>
        <Link
          href="#roster"
          className="inline-flex bg-white text-indigo-700 font-bold text-lg px-9 py-4 rounded-xl hover:bg-gray-100 transition-all hover:shadow-xl"
        >
          Explore All Talent
        </Link>
      </div>
    </section>
  );
}
