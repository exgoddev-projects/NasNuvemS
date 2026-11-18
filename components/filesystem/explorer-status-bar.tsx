type ExplorerStatusBarProps = {
  countText: string;
};

export default function ExplorerStatusBar({
  countText,
}: ExplorerStatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950 px-4 text-[10px] text-slate-500 sm:px-6 sm:text-xs">
      <span>{countText}</span>
      <span>NasNuvemS • em desenvolvimento</span>
    </footer>
  );
}
