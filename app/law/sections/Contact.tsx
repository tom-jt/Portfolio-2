import Form from "@/components/shared/Form";
import SectionTitle from "@/components/shared/SectionTitle";
import GoldCorners from "@/components/law/GoldCorners";
import GuillocheRings from "@/components/law/GuillocheRings";
import { profile } from "@/data/shared/profile";

const Contact = () => {
  return (
    <section
      id="contact"
      className="flex w-full scroll-mt-32 flex-col max-sm:items-center"
    >
      {/* The arcs are anchored to the bottom of this wrapper, which is now the
          bottom of the page — so the page ends on their diameter. */}
      <div className="relative w-full pb-24">
        <GuillocheRings
          half
          crop={0.25}
          rings={10}
          opacity={0.55}
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 w-[118%] -translate-x-1/2"
        />

        <div className="flex w-full justify-around gap-16 max-sm:flex-col max-sm:items-center sm:gap-24">
          <div className="flex flex-col gap-5 max-sm:items-center sm:w-1/2 sm:items-start 2xl:w-1/3">
            <SectionTitle
              eyebrow="Contact"
              title="Shoot Me a Message"
              as="h2"
              align="start"
              className="max-sm:items-center max-sm:[&_.c-h1]:text-center max-sm:[&_.c-eyebrow]:text-center"
            />
            <p className="text-accent-text text-base font-semibold">
              {profile.email}
            </p>
          </div>

          <div className="sm:w-1/2 2xl:w-1/3">
            {/* max-w-md matches the Form's own card width, so the brackets hug
                the card rather than this column. */}
            <div className="relative mx-auto w-full max-w-md">
              <GoldCorners />
              <Form />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
