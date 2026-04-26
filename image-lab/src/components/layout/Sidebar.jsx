import { useLocation } from 'react-router-dom';
import NoiseSidebar       from '../features/noise/NoiseSidebar';
import ConvolutionSidebar from '../features/convolution/ConvolutionSidebar';
import BlurSidebar        from '../features/blur/BlurSidebar';
import EdgeSidebar        from '../features/edge/EdgeSidebar';

const SIDEBAR_MAP = {
  '/app/noise':       NoiseSidebar,
  '/app/convolution': ConvolutionSidebar,
  '/app/blur':        BlurSidebar,
  '/app/edge':        EdgeSidebar,
};

export default function Sidebar() {
  const { pathname } = useLocation();
  const SidebarContent = SIDEBAR_MAP[pathname] || NoiseSidebar;

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-72 glass border-r border-surface-border z-40 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <SidebarContent />
      </div>
    </aside>
  );
}
