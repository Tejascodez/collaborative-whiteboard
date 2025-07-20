import React from 'react';
const UserCursors = ({ cursors }) => {
  return (
    <>
      {Object.entries(cursors).map(([id, { x, y, color }]) => (
        <div
          key={id}
          className="cursor"
          style={{
            left: x,
            top: y,
            borderColor: color,
            backgroundColor: color,
          }}
        />
      ))}
    </>
  );
};

export default UserCursors;
