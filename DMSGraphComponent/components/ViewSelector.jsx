import React from "react"

import get from "lodash/get"

import { useGetViews, strictNaN } from "./utils"

const ViewItem = ({ view, activeViewId, setViewId }) => {
  const doSetViewId = React.useCallback(e => {
    setViewId(view.view_id)
  }, [view.view_id]);
  const isActive = React.useMemo(() => {
    return view.view_id === activeViewId;
  }, [view.view_id, activeViewId]);

  const version = React.useMemo(() => {
    return get(view, ["version", "value"], view.version);
  }, [view]);

  return (
    <div className={ `
        w-fit cursor-pointer border-b-2 hover:bg-gray-300
        ${ isActive ? "border-current" : "border-transparent" }
      ` }
      onClick={ doSetViewId }
    >
      { !isActive ? null :
        <div className="inline-block mr-2">Active Version:</div>
      }
      <div className="inline-block">
        { !version ? null :
          strictNaN(version) ?
          `${ version }` :
          `Version ${ version }`
        }
      </div>
    </div>
  )
}

export const ViewSelector = ({ activeSource, setActiveView, activeView, pgEnv }) => {

  const sourceId = activeSource?.source_id;

  const views = useGetViews({ sourceId, pgEnv });

  const [viewId, setViewId] = React.useState(null);

  React.useEffect(() => {
    setViewId(null);
  }, [sourceId]);

  React.useEffect(() => {
    if (!viewId) {
      setViewId(get(views, [0, "view_id"], null));
    }
  }, [setViewId, viewId, views]);

  React.useEffect(() => {
    setActiveView(
      views.find(view => {
        return view.view_id === viewId;
      })
    )
  }, [setActiveView, views, viewId])

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    e.stopPropagation();
    setIsOpen(o => !o);
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [viewId]);

  const activeViewVersion = React.useMemo(() => {
    const version = get(activeView, ["version", "value"], activeView?.version);
    return version || null;
  }, [activeView]);

  return (
    <div>
      { !views.length ? null :
        <div>
          { !activeViewVersion ? null :
            !isOpen ? (
              <div className="border-b-2 border-current w-fit">
                <div className="inline-block mr-2">Active Version:</div>
                <div className="inline-block">
                  { !activeViewVersion ? null :
                    strictNaN(activeViewVersion) ?
                    `${ activeViewVersion }` :
                    `Version ${ activeViewVersion }`
                  }
                </div>
              </div>
            ) : (
              <div style={ { maxHeight: "300px" } }
                className="overflow-auto"
              >
                { views.map(view => (
                    <ViewItem key={ view.view_id }
                      view={ view }
                      setViewId={ setViewId }
                      activeViewId={ viewId }/>
                  ))
                }
              </div>
            )
          }
          { views.length < 2 ? null :
            <div className="text-blue-500 cursor-pointer inline-block"
              onClick={ toggle }
            >
              { isOpen ?
                "close" :
                "select another version"
              }
            </div>
          }
        </div>
      }
    </div>
  )
}
