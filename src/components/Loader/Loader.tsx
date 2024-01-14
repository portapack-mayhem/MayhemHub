export const Loader = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-5">
      <div
        className={
          "fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center"
        }
      >
        <h1 className={"text-3xl font-semibold"}>Loading...</h1>
      </div>
    </div>
  );
};
