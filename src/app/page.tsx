import Link from 'next/link';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
        <div className="mb-8 p-4 bg-purple-100 rounded-full">
          <BookOpen className="w-12 h-12 text-purple-600" />
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          Affective Landmarking
        </h1>
        
        <p className="text-xl text-gray-600 mb-12">
          A collaborative classroom tool for literary analysis. 
          Students annotate texts with Rasa/Emotion labels, 
          and teachers visualize the collective emotional spectrum of the class.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          <Link 
            href="/teacher/login"
            className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <GraduationCap className="w-10 h-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-gray-900">I'm a Teacher</span>
            <p className="text-gray-500 mt-2 text-sm text-center">
              Manage classes, upload texts, and view student visualizations.
            </p>
          </Link>

          <Link 
            href="/join"
            className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <Users className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-gray-900">I'm a Student</span>
            <p className="text-gray-500 mt-2 text-sm text-center">
              Join a class and start annotating literature.
            </p>
          </Link>
        </div>
      </main>

      <footer className="p-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Affective Landmarking • Built for CAIL Workshop
      </footer>
    </div>
  );
}
