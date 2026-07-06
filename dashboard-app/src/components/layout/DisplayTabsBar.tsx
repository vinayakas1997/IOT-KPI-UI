import './DisplayTabsBar.css';

export function DisplayTabsBar() {
  return (
    <div className="display-tabs">
      <div className="display-tab active">Display 1</div>
      <div className="display-tab">Display 2</div>
      <div className="display-tab-add">+</div>
    </div>
  );
}
