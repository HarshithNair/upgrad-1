'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/">
            <Image
              src="/upgrad-logo.png"
              alt="upGrad"
              width={110}
              height={36}
              style={{ objectFit: 'contain' }}
              className="header-logo"
              priority
            />
          </Link>
        </div>
        <nav className="header-nav">
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            Register
          </Link>
          <Link 
            href="/admin" 
            className={`nav-link ${pathname?.startsWith('/admin') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
