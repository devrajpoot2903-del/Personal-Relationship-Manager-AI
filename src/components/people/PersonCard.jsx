import { useState, useCallback } from 'react';
import { formatDate, calculateCountdown, getCountdownLabel, getCountdownClass, createObjectURL, revokeObjectURL, RELATIONSHIP_OPTIONS, EVENT_TYPE_OPTIONS } from '../../types';
import { createObjectURL: createObjectURLService, revokeObjectURL: revokeObjectURLService } from '../../services/indexedDB';
import { Calendar, User, Heart, Gift, Clock, MoreVertical } from 'lucide-react';

const PersonCard = ({ person, onClick, onEdit, onDelete, onOpenProfile }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Get the most relevant event for countdown (next upcoming)
  const getMainEvent = () => {
    if (!person.events?.length) return null;
    const eventsWithCountdown = person.events.map(event => ({
      ...event,
      countdown: calculateCountdown(event.date, event.recurring)
    }));
    eventsWithCountdown.sort((a, b) => {
      if (a.countdown.isPast && !b.countdown.isPast) return 1;
      if (!a.countdown.isPast && b.countdown.isPast) return -1;
      return a.countdown.days - b.countdown.days;
    });
    return eventsWithCountdown[0];
  };

  const mainEvent = getMainEvent();

  // Handle profile image
  useEffect(() => {
    if (person.profileImage?.blob) {
      const url = createObjectURL(person.profileImage.blob);
      setPreviewUrl(url);
    } else if (person.profileImage?.url) {
      setPreviewUrl(person.profileImage.url);
    }
    return () => {
      if (previewUrl) revokeObjectURL(previewUrl);
    };
  }, [person.profileImage]);

  const eventIcon = mainEvent ? EVENT_TYPE_OPTIONS.find(e => e.value === mainEvent.type)?.icon || '📅' : '📅';
  const eventTypeLabel = mainEvent ? EVENT_TYPE_OPTIONS.find(e => e.value === mainEvent.type)?.label || 'Event' : 'No events';
  const countdownLabel = mainEvent ? getCountdownLabel(mainEvent.countdown) : 'No events';
  const countdownClass = mainEvent ? getCountdownClass(mainEvent.countdown) : 'countdown-normal';

  const handleClick = (e) => {
    if (!e.target.closest('button') && !e.target.closest('[role="menu"]')) {
      onClick?.(person.id);
      if (onOpenProfile) onOpenProfile(person.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(person);
    setShowMenu(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(person);
    setShowMenu(false);
  };

  return (
    <article 
      className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden card-hover cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(person.id); }}}
    >
      {/* Profile Image */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={person.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <User className="w-16 h-16 text-neutral-300" />
          </div>
        )}
        
        {/* Menu */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="btn-icon bg-white/90 backdrop-blur-sm"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 animate-scale-in">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 text-lg truncate">{person.name}</h3>
        
        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {person.relationship}
        </p>

        {person.designation && (
          <p className="text-xs text-neutral-400 mt-0.5 truncate">{person.designation}</p>
        )}

        {/* Main Event */}
        {mainEvent && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{eventIcon}</span>
              <span className="font-medium text-neutral-700">
                {mainEvent.title || eventTypeLabel.replace(/^🎂\s|^💍\s|^📅\s/, '')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm text-neutral-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(mainEvent.date)}
                {mainEvent.recurring && <span className="text-xs text-neutral-400">(yearly)</span>}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${countdownClass}`}>
                {countdownLabel}
              </span>
            </div>
          </div>
        )}

        {!mainEvent && (
          <div className="mt-3 pt-3 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-400">No events added</p>
          </div>
        )}
      </div>
    </article>
  );
};

PersonCard.displayName = 'PersonCard';

export default PersonCard;