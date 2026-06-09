const ITEMS = [
  'Website Development', 'Study in UK', 'Student Visa Processing',
  'IELTS 8.0+ Coaching', 'Flight & Hotel Booking', 'Startup Investment',
  'Garments Export', 'Mobile App Development', 'Study in Malaysia',
  'Tourist Visa', 'PTE Training', 'Tour Packages', 'Market Research',
  'IT Equipment Import', 'Study in China', 'SOP Writing', 'Cloud Services',
  'Study in India', 'Trade Documentation',
]

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS]
  return (
    <div className="overflow-hidden border-y border-[#E5E7EC] py-4 bg-white select-none">
      <div className="flex marquee-track whitespace-nowrap" aria-hidden="true">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 mx-7 text-[0.78rem] font-medium text-muted"
          >
            <span className="w-1 h-1 rounded-full bg-[#D0D4DC] shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
