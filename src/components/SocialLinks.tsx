import React from 'react';

export const SOCIAL_LINKS = {
  // Enlace oficial y verificado a la cuenta de Instagram de EcoSerpentis Consulting
  instagram: 'https://www.instagram.com/ecoserpentisconsulting?rpxt=eDNzNWp1a3UyMHFr',
  linkedin: 'https://www.linkedin.com/in/ecoserpentis-consulting-939a99432/?isSelfProfile=true',
  email: 'mailto:ecoserpentisconsulting@gmail.com',
  emailRaw: 'ecoserpentisconsulting@gmail.com',
  whatsapp: 'https://wa.link/3rprxi',
};

interface SocialLinksProps {
  variant?: 'minimal' | 'full' | 'sidebar' | 'footer' | 'card';
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ variant = 'full', className = '' }) => {
  if (variant === 'sidebar') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <span className="text-[10px] uppercase font-bold text-[#B68A4F] tracking-wider block px-1">
          Contacto & Redes Oficiales
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {/* WhatsApp */}
          <a
            href={SOCIAL_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-none bg-[#102F27]/80 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-white text-[11px] font-medium transition-colors"
            title="Consulta directa por WhatsApp"
          >
            <svg className="w-3.5 h-3.5 shrink-0 fill-current text-[#25D366]" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.529 1.748.78 2.796.781 3.182 0 5.768-2.587 5.768-5.766.001-3.18-2.585-5.768-5.768-5.768zm3.376 8.163c-.141.397-.821.765-1.144.812-.323.047-.736.082-2.378-.588-1.973-.807-3.23-2.799-3.328-2.93-.099-.131-.796-1.061-.796-2.024 0-.963.504-1.436.683-1.631.179-.196.39-.245.52-.245.131 0 .262.001.376.007.121.006.282-.046.441.336.164.393.56 1.365.609 1.464.049.099.082.214.016.345-.065.131-.098.213-.196.327-.099.115-.208.257-.297.345-.099.098-.202.205-.087.402.115.197.512.846 1.099 1.369.757.674 1.394.883 1.591.982.197.098.312.082.427-.049.115-.131.492-.573.623-.77.131-.197.262-.164.443-.098.18.066 1.148.541 1.345.64.197.098.328.147.377.23.049.082.049.475-.092.872z" />
            </svg>
            <span className="truncate">WhatsApp</span>
          </a>

          {/* Instagram */}
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-none bg-[#102F27]/80 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-[11px] font-medium transition-colors"
            title="Instagram: @ecoserpentisconsulting"
          >
            <svg className="w-3.5 h-3.5 shrink-0 fill-current text-[#E1306C]" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="truncate">Instagram</span>
          </a>

          {/* LinkedIn */}
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-none bg-[#102F27]/80 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-[11px] font-medium transition-colors"
            title="LinkedIn EcoSerpentis Consulting"
          >
            <svg className="w-3.5 h-3.5 shrink-0 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span className="truncate">LinkedIn</span>
          </a>

          {/* Correo */}
          <a
            href={SOCIAL_LINKS.email}
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-none bg-[#102F27]/80 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-[11px] font-medium transition-colors"
            title="Correo oficial: ecoserpentisconsulting@gmail.com"
          >
            <svg className="w-3.5 h-3.5 shrink-0 stroke-current text-[#B68A4F]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">Correo</span>
          </a>
        </div>
      </div>
    );
  }

  // Footer or full layout with the sophisticated color palette
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* WhatsApp Link */}
      <a
        href={SOCIAL_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-none bg-[#185844]/60 hover:bg-[#185844] text-[#F2EBDD] border border-[#B68A4F]/50 text-xs font-semibold transition-all hover:scale-102"
        title="Consulta directa por WhatsApp"
      >
        <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.529 1.748.78 2.796.781 3.182 0 5.768-2.587 5.768-5.766.001-3.18-2.585-5.768-5.768-5.768zm3.376 8.163c-.141.397-.821.765-1.144.812-.323.047-.736.082-2.378-.588-1.973-.807-3.23-2.799-3.328-2.93-.099-.131-.796-1.061-.796-2.024 0-.963.504-1.436.683-1.631.179-.196.39-.245.52-.245.131 0 .262.001.376.007.121.006.282-.046.441.336.164.393.56 1.365.609 1.464.049.099.082.214.016.345-.065.131-.098.213-.196.327-.099.115-.208.257-.297.345-.099.098-.202.205-.087.402.115.197.512.846 1.099 1.369.757.674 1.394.883 1.591.982.197.098.328.147.377.23.049.082.049.475-.092.872z" />
        </svg>
        <span>WhatsApp</span>
      </a>

      {/* Instagram Link (Enlace directo sin preventDefault para abrir confiablemente) */}
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-none bg-[#185844]/60 hover:bg-[#185844] text-[#F2EBDD] hover:text-[#B68A4F] border border-[#B68A4F]/50 text-xs font-semibold transition-all hover:scale-102 cursor-pointer"
        title="Instagram Oficial @ecoserpentisconsulting"
      >
        <svg className="w-4 h-4 fill-current text-[#E1306C]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
        <span>Instagram (@ecoserpentisconsulting)</span>
      </a>

      {/* LinkedIn Link */}
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-none bg-[#185844]/60 hover:bg-[#185844] text-[#F2EBDD] hover:text-[#B68A4F] border border-[#B68A4F]/50 text-xs font-semibold transition-all hover:scale-102"
        title="LinkedIn EcoSerpentis Consulting"
      >
        <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
        <span>LinkedIn</span>
      </a>

      {/* Correo Link */}
      <a
        href={SOCIAL_LINKS.email}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-none bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD] border border-[#185844] hover:border-[#B68A4F]/50 text-xs font-semibold transition-all hover:scale-102"
        title="ecoserpentisconsulting@gmail.com"
      >
        <svg className="w-4 h-4 stroke-current text-[#B68A4F]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>ecoserpentisconsulting@gmail.com</span>
      </a>
    </div>
  );
};
