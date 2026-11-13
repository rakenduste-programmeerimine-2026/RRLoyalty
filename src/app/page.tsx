import Link from "next/link";

const groups = [
  {
    title: "Nimepäev",
    screens: [
      { href: "/postkast/nimepaev", label: "E-kiri: palju õnne" },
      { href: "/nimekaimud", label: "Sinu nimekaimud" },
      { href: "/raamat/sugisene-raamatupood", label: "Raamatu leht, −10%" },
      { href: "/ostukorv", label: "Ostukorv" },
    ],
  },
  {
    title: "100 punkti tasu",
    screens: [
      { href: "/postkast/100-punkti", label: "E-kiri: 100 punkti" },
      { href: "/konto/gustavi-rada/tasu", label: "Vali tasu" },
      { href: "/konto/gustavi-rada/kinkekaart", label: "Kinkekaart" },
      { href: "/konto/gustavi-rada/annetus", label: "Annetus" },
    ],
  },
  {
    title: "Sünnipäev",
    screens: [{ href: "/postkast/sunnipaev", label: "E-kiri: sünnipäev" }],
  },
  {
    title: "Konto",
    screens: [
      { href: "/konto/gustavi-rada", label: "Gustavi rada" },
      { href: "/postkast", label: "Postkast" },
    ],
  },
];

export default function ScreenIndex() {
  return (
    <main className="index">
      <h1>Gustavi rada</h1>
      <p className="muted">Disaini ekraanid</p>
      {groups.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          <ul>
            {group.screens.map((screen) => (
              <li key={screen.href}>
                <Link href={screen.href}>{screen.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
