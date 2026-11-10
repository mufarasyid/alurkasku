import alurkaskuLogo from "../../assets/alurkasku.svg";

const AuthBrandPanel = () => (
  <div className="hidden md:flex bg-primary flex-col items-center justify-center gap-5 px-10">
    <img
      src={alurkaskuLogo}
      alt="Alurkasku"
      className="size-28 rounded-3xl shadow-2xl shadow-black/40"
    />
    <div className="text-center">
      <p className="text-3xl font-bold tracking-wide text-white">Alurkasku</p>
      <p className="mt-1 text-sm font-medium text-gold">Money Management</p>
    </div>
  </div>
);

export default AuthBrandPanel;
